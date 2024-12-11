var express = require('express');
var router = express.Router();
var mssql = require('mssql');
const jwt = require('jsonwebtoken');
const moment = require('moment');
require('dotenv').config();


const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true, 
        enableArithAbort: true, 
    },
};

function offSet(date) {
    return date.getTimezoneOffset() / 60;
}

const diasSemana = [
    'Lunes',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Lunes'
];

function formatDate(date) {
    var fecha = '';
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear(),
        hour = d.getHours() + Number(offSet(date)),
        minute = d.getMinutes();

    if (hour.toString().length == 1) {
        hour = '0' + hour;
    }
    if (minute.toString().length == 1) {
        minute = '0' + minute;
    }

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    fecha = hour + ":" + minute + " " + day + "-" + month + "-" + year

    return fecha;
}

const formatDateToISOString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
};

async function verifyAndRenewToken(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ error: 'Access Token requerido' });
    }

    try {
        const accessToken = token.split(' ')[1];
        try {
            const decoded = jwt.verify(accessToken, process.env.ACCESS_SECRET);

            req.user = decoded;
            return next();
        } catch (err) {
            if (err.name === "TokenExpiredError") {

                const refreshToken = req.headers['x-refresh-token'];
                if (!refreshToken) {
                    return res.status(401).json({ error: 'Refresh Token requerido' });
                }

                const pool = await mssql.connect(config);
                const tokenResult = await pool.request()
                    .input('refreshToken', mssql.NVarChar, refreshToken)
                    .query('SELECT * FROM Tokens WHERE refreshToken = @refreshToken');

                if (tokenResult.recordset.length === 0) {
                    return res.status(403).json({ error: 'Refresh Token inválido o no encontrado' });
                }

                const tokenData = tokenResult.recordset[0];
                if (new Date(tokenData.FechaExpiracion) < new Date()) {
                    return res.status(403).json({ error: 'Refresh Token expirado' });
                }

                const userResult = await pool.request()
                    .input('usuarioid', mssql.Int, tokenData.usuarioid)
                    .query('SELECT * FROM Usuarios WHERE id = @usuarioid');

                if (userResult.recordset.length === 0) {
                    return res.status(403).json({ error: 'Usuario no encontrado' });
                }

                const user = userResult.recordset[0];
                console.log(user)
                const newAccessToken = jwt.sign({ id: user.id, tipo: user.tipo }, process.env.ACCESS_SECRET, { expiresIn: '2h' });
                const newRefreshToken = jwt.sign({ id: user.id, tipo: user.tipo }, process.env.REFRESH_SECRET, { expiresIn: '7d' });

                await pool.request()
                    .input('refreshToken', mssql.NVarChar, refreshToken)
                    .query('DELETE FROM Tokens WHERE refreshToken = @refreshToken');

                await pool.request()
                    .input('usuarioid', mssql.Int, user.id)
                    .input('newRefreshToken', mssql.NVarChar, newRefreshToken)
                    .input('fechaExpiracion', mssql.DateTime, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
                    .query(`
                        INSERT INTO Tokens (usuarioid, refreshToken, fechaExpiracion)
                        VALUES (@usuarioid, @newRefreshToken, @fechaExpiracion)
                    `);
                console.log(newAccessToken);
                req.newAccessToken = newAccessToken;
                req.newRefreshToken = newRefreshToken;

                return next();
            } else {
                res.status(403).json({ error: 'Access Token inválido' });
            }
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
}

router.post('/listado', verifyAndRenewToken, async (req, res) => {
    var id = req.body.id;
    var fecha = new Date();
    fecha.setHours(fecha.getHours + offSet(fecha))
    try {
        await mssql.connect(config);
        const lista = []

        try {
            var query = "SELECT id, fecha_hora FROM [dbo].[Citas] "+
            "where paciente_id = " + id + " and fecha_hora > '" + 
            formatDateToISOString(new Date()) + "' order by fecha_hora;"
            const result = await mssql.query(query)

            for (var i = 0; i < result.recordset.length; i++) {
                var resultado = result.recordset[i];
                lista.push({ id: resultado.id, fecha_hora: formatDate(resultado.fecha_hora) })
            }
            return res.send({
                'success': true, 'lista': lista,
                'accessToken': req.newAccessToken,
                'refreshToken': req.newRefreshToken
            });

        } catch (err) {
            return res.send({ 'success': false, 'message': 'Error en la consulta' ,
                'accessToken': req.newAccessToken,
                'refreshToken': req.newRefreshToken});
        }

    } catch (err) {
        return res.send({ 'success': false, 'message': 'Error en la conexión: ' + err.message,
            'accessToken': req.newAccessToken,
            'refreshToken': req.newRefreshToken });
    }
})

router.post('/listadoHoras', verifyAndRenewToken, async (req, res) => {
    console.log(req.body)
    var idMedico = req.body.idMedico;
    var fecha = new Date(req.body.fechaCita)
    console.log(fecha)
    var citas = []

    fecha.setHours(new Date().getHours())
    fecha.setMinutes(new Date().getMinutes())

    console.log(fecha)
    console.log(fecha.getUTCHours())
    console.log(fecha.getHours())
    console.log(fechaAux)

    console.log(fecha.getDay())

    console.log(fecha.getDay())

    if (fecha.getDay() == 0) {
        console.log("Domingo")
        fecha.setDate(fecha.getDate() + 1)
        fecha.setHours(0);
    }
    else if (fecha.getDay() == 6) {
        console.log("Sabado")
        fecha.setDate(fecha.getDate() + 2)
        fecha.setHours(0);
    }

    var fechaAux = new Date(fecha.getTime());

    fechaAux.setDate(fecha.getDate() + 1)

    console.log(fecha)
    console.log(fechaAux)
    var diaSemana = diasSemana[fecha.getDay()]

    try {
        await mssql.connect(config);

        console.log('Conexion bien');
        var lista = []

        try {
            while (true) {
                var query = "SELECT DATEDIFF(minute, hora_inicio, hora_fin) as MinutosTranscurridos, hora_inicio, hora_fin FROM [dbo].[HorariosMedicos] where medico_id = " + idMedico + " and dia_semana = '" + diaSemana + "';"
                console.log(query);
                var result = await mssql.query(query)
                console.log(result.recordset[0])
                var numeroCitas = result.recordset[0].MinutosTranscurridos / 15;
                var hora_inicio = new Date(fecha);
                hora_inicio.setHours(result.recordset[0].hora_inicio.getUTCHours());
                hora_inicio.setMinutes(result.recordset[0].hora_inicio.getMinutes());
                hora_inicio.setSeconds(0);
                hora_inicio.setMilliseconds(0);
                
                console.log(hora_inicio)
                var hora_fin = new Date(fecha);
                console.log(hora_fin)
                console.log(result.recordset[0].hora_fin.getUTCHours())
                hora_fin.setHours(result.recordset[0].hora_fin.getHours());
                hora_fin.setMinutes(result.recordset[0].hora_fin.getMinutes());
                hora_fin.setSeconds(0);
                hora_fin.setMilliseconds(0);
                console.log(hora_fin)
                console.log(fecha)

                if (hora_fin < fecha) {
                    hora_inicio.setDate(hora_inicio.getDate() + 1)
                    hora_fin.setDate(hora_fin.getDate() + 1)
                    fecha.setDate(fecha.getDate() + 1)
                    fechaAux.setDate(fechaAux.getDate() + 1)
                    fecha.setHours(0);
                    fechaAux.setHours(0);
                }

                if (hora_inicio.getDay() == 0) {
                    console.log("Domingo")
                    hora_inicio.setDate(hora_inicio.getDate() + 1)
                    hora_fin.setDate(hora_fin.getDate() + 1)
                    fecha.setDate(fecha.getDate() + 1)
                    fechaAux.setDate(fechaAux.getDate() + 1)
                }
                else if (hora_fin.getDay() == 6) {
                    console.log("Sabado")
                    hora_inicio.setDate(hora_inicio.getDate() + 2)
                    hora_fin.setDate(hora_fin.getDate() + 2)
                    fecha.setDate(fecha.getDate() + 2)
                    fechaAux.setDate(fechaAux.getDate() + 2)
                }

                console.log('------')
                console.log(hora_inicio.getUTCHours())
                console.log(hora_inicio)
                console.log(fecha)
                console.log(hora_fin)

                if (hora_inicio < new Date()) {
                    hora_inicio.setHours(fecha.getHours())
                    hora_inicio.setMinutes(fecha.getMinutes())
                }

                console.log(hora_inicio)
                console.log(hora_fin)
                console.log(offSet(hora_inicio))
                console.log(hora_inicio.getHours())
                console.log(hora_inicio.getMinutes())
                console.log(hora_inicio.getUTCHours())
                console.log(hora_fin.getUTCHours())
                for (var i = hora_inicio.getHours(); i < hora_fin.getUTCHours(); i++) {
                    console.log('----------------------')
                    console.log(i)
                    console.log(hora_inicio.getUTCHours())
                    console.log(offSet(hora_inicio))
                    console.log(offSet(hora_fin))
                    if (i == hora_inicio.getHours()
                        && hora_inicio.getDate() == new Date().getDate()) {
                        minutos = hora_inicio.getMinutes();
                        if (minutos < 15)
                            lista.push(i + ":15");
                        if (minutos < 30)
                            lista.push(i + ":30");
                        if (minutos < 45)
                            lista.push(i + ":45");
                    }
                    else {
                        lista.push(i + ":00")
                        lista.push(i + ":15")
                        lista.push(i + ":30")
                        lista.push(i + ":45")
                    }

                }

                var query = "SELECT count(*) as num FROM [dbo].[Citas] where medico_id = " + idMedico + " and fecha_hora >= '" + formatDateToISOString(fecha) + "' and fecha_hora < '" + formatDateToISOString(fechaAux) + "';"
                console.log(query);
                var result = await mssql.query(query)
                console.log(result.recordset[0].num != numeroCitas)
                console.log(lista.length != 0)
                console.log(lista)
                if (result.recordset[0].num != numeroCitas && lista.length != 0)
                    break;

                console.log(fecha.getDay())
                if (fecha.getDay() == 5) {
                    fecha.setDate(fecha.getDate() + 3)
                    fechaAux.setDate(fechaAux.getDate() + 3)
                }
                else if (fecha.getDay() == 6) {
                    fecha.setDate(fecha.getDate() + 2)
                    fechaAux.setDate(fechaAux.getDate() + 2)
                }
                else {
                    fecha.setDate(fecha.getDate() + 1)
                    fechaAux.setDate(fechaAux.getDate() + 1)
                }
                diaSemana = diasSemana[fecha.getDay()]
            }


            var query = "SELECT fecha_hora FROM [dbo].[Citas] where medico_id = " + idMedico + " and fecha_hora >= '" + formatDateToISOString(fecha) + "' and fecha_hora < '" + formatDateToISOString(fechaAux) + "';"
            console.log(query);
            var result = await mssql.query(query)

            for (var i = 0; i < result.recordset.length; i++) {
                var fecha_hora = result.recordset[i].fecha_hora;

                var hora = fecha_hora.getUTCHours() + offSet(fecha_hora);
                var min = fecha_hora.getMinutes();
                var total = hora + ":" + min

                lista = lista.filter(elemento => elemento !== total);
            }

            const options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            };

            return res.send({
                'success': true, 'lista': lista, 'fechaCita': fecha.toLocaleDateString('es-ES', options), 'fecha': fecha,
                'accessToken': req.newAccessToken,
                'refreshToken': req.newRefreshToken
            });

        } catch (err) {
            console.error('Error 2:', err.message);
            return res.send({ 'success': false, 'message': 'Error en la consulta' ,
                'accessToken': req.newAccessToken,
                'refreshToken': req.newRefreshToken});
        }

    } catch (err) {
        console.error('Error 1:', err.message);
        return res.send({ 'success': false, 'message': 'Error en la conexión: ' + err.message,
            'accessToken': req.newAccessToken,
            'refreshToken': req.newRefreshToken });
    }
})

router.post('/listadoMedico', verifyAndRenewToken, async (req, res) => {
    var id = req.body.id;
    var fecha = new Date();
    fecha.setHours(0);
    fecha.setMinutes(0);
    fecha.setSeconds(0);

    try {
        await mssql.connect(config);

        console.log('Conexion bien');
        const lista = []

        try {
            var query = "SELECT c.id, c.fecha_hora, u.nombre, u.apellidos FROM [dbo].[Citas] c, [dbo].[Usuarios] u where c.medico_id = " + id + " and c.fecha_hora > '" + formatDateToISOString(new Date()) + "' and c.paciente_id = u.id order by fecha_hora;"
            console.log(query);
            const result = await mssql.query(query)

            for (var i = 0; i < result.recordset.length; i++) {
                var resultado = result.recordset[i];
                console.log(resultado);
                lista.push({
                    id: resultado.id,
                    time: formatDate(resultado.fecha_hora),
                    name: resultado.nombre + " " + resultado.apellidos
                })
            }
            return res.send({
                'success': true, 'lista': lista,
                'accessToken': req.newAccessToken,
                'refreshToken': req.newRefreshToken
            });

        } catch (err) {
            console.error('Error 2:', err.message);
            return res.send({ 'success': false, 'message': 'Error en la consulta',
                'accessToken': req.newAccessToken,
                'refreshToken': req.newRefreshToken });
        }

    } catch (err) {
        console.error('Error 1:', err.message);
        return res.send({ 'success': false, 'message': 'Error en la conexión: ' + err.message,
            'accessToken': req.newAccessToken,
            'refreshToken': req.newRefreshToken });
    }
})

router.post('/detalle', verifyAndRenewToken, async (req, res) => {
    var id = req.body.id;

    var direccion = "";
    var fecha_hora = "";
    try {
        await mssql.connect(config);

        console.log('Conexion bien');
        const lista = []

        try {
            var query = "select ce.direccion, c.fecha_hora from [dbo].[Citas] c, [dbo].[Usuarios] u, [dbo].[Centros] ce where c.id = " + id + " and c.medico_id = u.id  and u.centro = ce.id;"
            console.log(query);
            var result = await mssql.query(query)

            if (result.recordset.length > 0) {
                direccion = result.recordset[0].direccion;
                fecha_hora = moment(result.recordset[0].fecha_hora).utc().format('hh:mm');
            }

            return res.send({
                'success': true, 'direccion': direccion, 'fecha_hora': fecha_hora,
                'accessToken': req.newAccessToken,
                'refreshToken': req.newRefreshToken
            });

        } catch (err) {
            console.error('Error 2:', err.message);
            return res.send({ 'success': false, 'message': 'Error en la consulta' ,
                'accessToken': req.newAccessToken,
                'refreshToken': req.newRefreshToken});
        }

    } catch (err) {
        console.error('Error 1:', err.message);
        return res.send({ 'success': false, 'message': 'Error en la conexión: ' + err.message ,
            'accessToken': req.newAccessToken,
            'refreshToken': req.newRefreshToken});
    }
})

router.post('/informacion', verifyAndRenewToken, async (req, res) => {
    var id = req.body.id;

    var medico = "";
    try {
        await mssql.connect(config);

        console.log('Conexion bien');

        try {
            var query = "select m.id, m.nombre, m.apellidos from [dbo].[Usuarios] p, [dbo].[Usuarios] m where p.id = " + id + " and p.medico = m.id;"
            console.log(query);
            var result = await mssql.query(query)
            console.log(result)
            if (result.recordset.length > 0) {
                id = result.recordset[0].id;
                medico = result.recordset[0].nombre + " " + result.recordset[0].apellidos;
            }

            console.log(medico)

            
            return res.send({
                'success': true, 'id_medico': id, 'medico': medico,
                'accessToken': req.newAccessToken,
                'refreshToken': req.newRefreshToken
            });

        } catch (err) {
            console.error('Error 2:', err.message);
            return res.send({ 'success': false, 'message': 'Error en la consulta',
                'accessToken': req.newAccessToken,
                'refreshToken': req.newRefreshToken });
        }

    } catch (err) {
        console.error('Error 1:', err.message);
        return res.send({ 'success': false, 'message': 'Error en la conexión: ' + err.message,
            'accessToken': req.newAccessToken,
            'refreshToken': req.newRefreshToken });
    }
})

router.post('/crear', verifyAndRenewToken, async (req, res) => {
    var id_paciente = req.body.id_paciente;
    var id_medico = req.body.id_medico;
    var fecha = req.body.fecha;

    try {
        await mssql.connect(config);

        try {
            var query = "insert into [dbo].[Citas] values(" + id_paciente + "," + id_medico + ",'" + fecha + "');"

            mssql.query(query, function (err, result) {
                if (err) {
                    return res.send({ 'success': false, 'message': 'Error al insertar los datos',
                        'accessToken': req.newAccessToken,
                        'refreshToken': req.newRefreshToken });
                } else {
                    return res.send({
                        'success': true, 'message': 'OK',
                        'accessToken': req.newAccessToken,
                        'refreshToken': req.newRefreshToken
                    });
                }
            })
        } catch (err) {
            return res.send({ 'success': false, 'message': 'Error en la consulta' ,
                'accessToken': req.newAccessToken,
                'refreshToken': req.newRefreshToken});
        }
    } catch (err) {
        return res.send({ 'success': false, 'message': 'Error en la conexión: ' + err.message,
            'accessToken': req.newAccessToken,
            'refreshToken': req.newRefreshToken });
    }
})

router.post('/borrar', verifyAndRenewToken, async (req, res) => {
    var id = req.body.id;

    try {
        await mssql.connect(config);

        console.log('Conexion bien');

        try {
            var query = "DELETE FROM [dbo].[Citas] where id = " + id + ";"
            console.log(query);

            mssql.query(query, function (err, result) {
                if (err) {
                    return res.send({ 'success': false, 'message': 'Error al borrar los datos' ,
                        'accessToken': req.newAccessToken,
                        'refreshToken': req.newRefreshToken});
                } else {
                    return res.send({
                        'success': true, 'message': 'OK',
                        'accessToken': req.newAccessToken,
                        'refreshToken': req.newRefreshToken
                    });
                }
            })

        } catch (err) {
            console.error('Error 2:', err.message);
            return res.send({ 'success': false, 'message': 'Error en la consulta',
                'accessToken': req.newAccessToken,
                'refreshToken': req.newRefreshToken });
        }

    } catch (err) {
        console.error('Error 1:', err.message);
        return res.send({ 'success': false, 'message': 'Error en la conexión: ' + err.message,
            'accessToken': req.newAccessToken,
            'refreshToken': req.newRefreshToken });
    }
})



module.exports = router;
