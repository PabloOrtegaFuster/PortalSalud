var express = require('express');
var router = express.Router();
var mssql = require('mssql');
const moment = require('moment');
const jwt = require('jsonwebtoken');
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

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [year, month, day].join('-');
}

async function verifyAndRenewToken(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ error: 'Access Token requerido' });
    }

    try {
        const accessToken = token.split(' ')[1];
        try {
            const decoded = jwt.verify(accessToken, process.env.ACCESS_SECRET);
            console.log(decoded)
            req.user = decoded;
            return next();
        } catch (err) {
            console.log(err.name === "TokenExpiredError")
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
    var fecha = formatDate(new Date());
    try {
        const pool = await mssql.connect(config);

        console.log('Conexion bien');
        const lista = []

        try {
            const result = await pool.request()
                .input('id', mssql.Int, id)
                .input('fecha', mssql.NVarChar, fecha)
                .query('SELECT r.id as id_r, m.nombre, m.id as id_m FROM [dbo].[Recetas] r, [dbo].[Medicamentos] m ' +
                    ' where id_paciente = @id and r.id_medicamento = m.id and fecha_fin >= @fecha and fecha_inicio <= @fecha')


            for (var i = 0; i < result.recordset.length; i++) {
                var resultado = result.recordset[i];
                console.log(resultado);
                lista.push({ id_receta: resultado.id_r, nombre: resultado.nombre, id_medicamento: resultado.id_m })
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
        return res.send({ 'success': false, 'message': 'Error en la conexión: ' + err.message ,
            'accessToken': req.newAccessToken,
            'refreshToken': req.newRefreshToken});
    }
})

router.post('/listadoExpiradas', verifyAndRenewToken, async (req, res) => {
    var id = req.body.id;
    var fecha = formatDate(new Date());
    try {
        const pool = await mssql.connect(config);

        console.log('Conexion bien');
        const lista = []

        try {
            const result = await pool.request()
                .input('id', mssql.Int, id)
                .input('fecha', mssql.NVarChar, fecha)
                .query('SELECT r.id as id_r, m.nombre, m.id as id_m FROM [dbo].[Recetas] r, [dbo].[Medicamentos] m ' +
                    ' where id_paciente = @id and r.id_medicamento = m.id and fecha_fin < @fecha')

            for (var i = 0; i < result.recordset.length; i++) {
                var resultado = result.recordset[i];
                console.log(resultado);
                lista.push({ id_receta: resultado.id_r, nombre: resultado.nombre, id_medicamento: resultado.id_m })
            }
            return res.send({
                'success': true, 'lista': lista,
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
    var centro = "";
    try {
        const pool = await mssql.connect(config);

        console.log('Conexion bien');
        const lista = []

        try {
            var result = await pool.request()
                .input('id', mssql.Int, id)
                .query('select m.id, m.nombre, m.apellidos, c.nombre as centro ' +
                    'from [dbo].[Usuarios] p, [dbo].[Usuarios] m, [dbo].[Centros] c ' +
                    'where p.id = @id and p.medico = m.id and p.centro = c.id')

            if (result.recordset.length > 0) {
                id = result.recordset[0].id;
                medico = result.recordset[0].nombre + " " + result.recordset[0].apellidos;
                centro = result.recordset[0].centro;
            }

            var query = "select * from [dbo].[Medicamentos];"
            console.log(query);
            result = await pool.request()
                .query('select * from [dbo].[Medicamentos]')

            for (var i = 0; i < result.recordset.length; i++) {
                var resultado = result.recordset[i];
                console.log(resultado);
                lista.push({ value: resultado.id, label: resultado.nombre })
            }
            console.log(lista);
            return res.send({
                'success': true, 'id_medico': id, 'medico': medico, 'centro': centro, 'medicamentos': lista,
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

router.post('/detalle', verifyAndRenewToken, async (req, res) => {
    var id = req.body.id;

    var nombre = "";
    var descripcion = "";
    var prospecto = "";
    var fecha_inicio = "";
    var fecha_fin = "";
    var horas = "";
    try {
        const pool = await mssql.connect(config);

        console.log('Conexion bien');
        const lista = []

        try {
            const result = await pool.request()
                .input('id', mssql.Int, id)
                .query('select m.nombre, m.descripcion, m.prospecto, r.fecha_inicio, r.fecha_fin, r.horas ' +
                    'from [dbo].[Recetas] r, [dbo].[Medicamentos] m ' +
                    'where r.id = @id and r.id_medicamento = m.id')

            if (result.recordset.length > 0) {
                nombre = result.recordset[0].nombre;
                descripcion = result.recordset[0].descripcion;
                prospecto = result.recordset[0].prospecto;
                fecha_inicio = moment(result.recordset[0].fecha_inicio).format('DD/MM/YYYY');
                fecha_fin = moment(result.recordset[0].fecha_fin).format('DD/MM/YYYY');
                horas = result.recordset[0].horas;
            }

            return res.send({
                'success': true, 'nombre': nombre, 'descripcion': descripcion,
                'prospecto': prospecto, 'fecha_inicio': fecha_inicio, 'fecha_fin': fecha_fin, 'horas': horas,
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

router.post('/borrar', verifyAndRenewToken, async (req, res) => {
    var id = req.body.id;

    try {
        const pool = await mssql.connect(config);

        console.log('Conexion bien');

        try {
            const result = await pool.request()
                .input('id', mssql.Int, id)
                .query('DELETE FROM [dbo].[Recetas] where id = @id')

            if (result.rowsAffected[0] > 0) {
                return res.send({
                    'success': true, 'message': 'OK',
                    'accessToken': req.newAccessToken,
                    'refreshToken': req.newRefreshToken
                });
            } else {
                return res.send({ 'success': false, 'message': 'No se encontró la receta para borrar' ,
                    'accessToken': req.newAccessToken,
                    'refreshToken': req.newRefreshToken});
            }

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
    var id_medicamento = req.body.id_medicamento;
    var horas = req.body.horas;
    var fecha = req.body.fecha

    try {
        const pool = await mssql.connect(config);

        console.log('Conexion bien');
        const lista = []

        try {
            const result = await pool.request()
                .input('id_paciente', mssql.Int, id_paciente)
                .input('id_medicamento', mssql.Int, id_medicamento)
                .input('inicio', mssql.Date, formatDate(new Date()))
                .input('fin', mssql.Date, formatDate(fecha))
                .input('horas', mssql.Int, horas)
                .query('insert into [dbo].[Recetas] ' +
                    ' values(@id_paciente, @id_medicamento, @inicio, @fin, @horas')


            if (result.rowsAffected[0] > 0) {
                return res.send({
                    'success': true, 'message': 'OK',
                    'accessToken': req.newAccessToken,
                    'refreshToken': req.newRefreshToken
                });
            } else {
                return res.send({ 'success': false, 'message': 'Error al insertar los datos' ,
                    'accessToken': req.newAccessToken,
                    'refreshToken': req.newRefreshToken});
            }



        } catch (err) {
            console.error('Error 2:', err.message);
            return res.send({ 'success': false, 'message': 'Error en la consulta',
                'accessToken': req.newAccessToken,
                'refreshToken': req.newRefreshToken });
        }

    } catch (err) {
        console.error('Error 1:', err.message);
        return res.send({ 'success': false, 'message': 'Error en la conexión: ' + err.message ,
            'accessToken': req.newAccessToken,
            'refreshToken': req.newRefreshToken});
    }
})

module.exports = router;
