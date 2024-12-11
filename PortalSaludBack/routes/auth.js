var express = require('express');
var router = express.Router();
var mssql = require('mssql');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
var bcrypt = require('bcryptjs')
require('dotenv').config();

const hash = process.env.HASH

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

const auth = {
    user: process.env.CORREO,
    pass: process.env.PASS,
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

router.options('/login', async function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    var correo = req.body.correo;
    var password = bcrypt.hashSync(req.body.password, hash);


    try {
        const pool = await mssql.connect(config);

        console.log('Conexion bien');
        console.log(password)
        try {
            const result = await pool.request()
                .input('correo', mssql.NVarChar, correo)
                .input('password', mssql.NVarChar, password)
                .query('SELECT * FROM Usuarios WHERE correo = @correo AND password = @password')

            console.log(result)

            if (result.recordset.length > 0) {
                const usuario = result.recordset[0]

                const tokenResult = await pool.request()
                    .input('usuarioid', mssql.Int, usuario.id)
                    .query(`
                    SELECT * 
                    FROM Tokens 
                    WHERE usuarioid = @usuarioid 
                      AND fechaExpiracion > GETDATE()
                `);

                var refreshToken;

                if (tokenResult.recordset.length > 0) {
                    refreshToken = tokenResult.recordset[0].refreshToken;
                    console.log('Refresh Token existente encontrado:', refreshToken);
                } else {
                    refreshToken = jwt.sign({ id: usuario.id, tipo: usuario.tipo }, process.env.REFRESH_SECRET, { expiresIn: '14d' });

                    await pool.request()
                        .input('usuarioid', mssql.Int, usuario.id)
                        .input('refreshToken', mssql.NVarChar, refreshToken)
                        .input('fechaExpiracion', mssql.DateTime, new Date(Date.now() + 14 * 24 * 60 * 60 * 1000))
                        .query(`
                        INSERT INTO Tokens (usuarioid, refreshToken, fechaExpiracion)
                        VALUES (@usuarioid, @refreshToken, @fechaExpiracion)
                    `);
                    console.log('Nuevo Refresh Token generado:', refreshToken);
                }

                const accessToken = jwt.sign({ id: usuario.id, tipo: usuario.tipo }, process.env.ACCESS_SECRET, { expiresIn: '2h' });



                return res.send({
                    'success': true, 'user': usuario.nombre,
                    'id': usuario.id, 'tipo': usuario.tipo,
                    'medico': usuario.medico, 'accessToken': accessToken,
                    'refreshToken': refreshToken
                });
            } else {
                return res.send({ 'success': false, 'message': 'Usuario o contraseña incorrectos' });
            }
        } catch (err) {
            console.error('Error:', err.message);
            return res.send({ 'success': false, 'message': 'Error en la consulta' });
        }

    } catch (err) {
        console.error('Error:', err.message);
        return res.send({ 'success': false, 'message': 'Error en la conexión: ' + err.message });
    }
});

router.post('/login', async function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    var correo = req.body.correo;


    var password = bcrypt.hashSync(req.body.password, hash);


    try {
        const pool = await mssql.connect(config);

        console.log('Conexion bien');
        console.log(password)
        try {
            const result = await pool.request()
                .input('correo', mssql.NVarChar, correo)
                .input('password', mssql.NVarChar, password)
                .query('SELECT * FROM Usuarios WHERE correo = @correo AND password = @password')

            console.log(result)

            if (result.recordset.length > 0) {
                const usuario = result.recordset[0]

                const tokenResult = await pool.request()
                    .input('usuarioid', mssql.Int, usuario.id)
                    .query(`
                    SELECT * 
                    FROM Tokens 
                    WHERE usuarioid = @usuarioid 
                      AND fechaExpiracion > GETDATE()
                `);

                var refreshToken;

                if (tokenResult.recordset.length > 0) {
                    refreshToken = tokenResult.recordset[0].refreshToken;
                } else {
                    refreshToken = jwt.sign({ id: usuario.id, tipo: usuario.tipo }, process.env.REFRESH_SECRET, { expiresIn: '7d' });

                    await pool.request()
                        .input('usuarioid', mssql.Int, usuario.id)
                        .input('refreshToken', mssql.NVarChar, refreshToken)
                        .input('fechaExpiracion', mssql.DateTime, new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)) 
                        .query(`
                        INSERT INTO Tokens (usuarioid, refreshToken, fechaExpiracion)
                        VALUES (@usuarioid, @refreshToken, @fechaExpiracion)
                    `);
                    console.log('Nuevo Refresh Token generado:', refreshToken);
                }

                const accessToken = jwt.sign({ id: usuario.id, tipo: usuario.tipo }, process.env.ACCESS_SECRET, { expiresIn: '15m' });

                return res.send({
                    'success': true, 'user': usuario.nombre,
                    'id': usuario.id, 'tipo': usuario.tipo,
                    'medico': usuario.medico, 'accessToken': accessToken,
                    'refreshToken': refreshToken
                });
            } else {
                return res.send({ 'success': false, 'message': 'Usuario o contraseña incorrectos' });
            }
        } catch (err) {
            console.error('Error:', err.message);
            return res.send({ 'success': false, 'message': 'Error en la consulta' });
        }

    } catch (err) {
        console.error('Error:', err.message);
        return res.send({ 'success': false, 'message': 'Error en la conexión: ' + err.message });
    }
});

router.post('/registro', async function (req, res, next) {
    var nombre = req.body.nombre;
    var apellidos = req.body.apellidos;
    var correo = req.body.correo;

    var password = bcrypt.hashSync(req.body.password, hash);

    var fechaNacimiento = req.body.fechaNacimiento;
    var dni = req.body.dni;
    var telefono = req.body.telefono;
    var centro = req.body.centro;
    var medico;

    try {
        await mssql.connect(config);

        console.log('Conexion bien');

        try {
            var result = await mssql.query("SELECT id FROM [dbo].[Usuarios] where tipo = 'Medico' and centro = '" + centro + "'")


            medico = result.recordset[0].id;
            var minpacientes;
            for (var i = 0; i < result.recordset.length; i++) {
                medicoaux = result.recordset[i].id;
                var resultaux = await mssql.query("SELECT count(*) as pacientes FROM [dbo].[Usuarios] where medico =" + medicoaux)
                if (i == 0) {
                    minpacientes = resultaux.recordset[0].pacientes
                }
                else {
                    if (resultaux.recordset[0].pacientes < minpacientes) {
                        medico = medicoaux
                    }
                }

            }

            var sql = "INSERT INTO [dbo].[Usuarios] VALUES('" + nombre +
                "','" + apellidos + "','" + correo + "','" + password + "','" + fechaNacimiento +
                "','" + dni + "','" + telefono + "','Paciente'," + medico + "," + centro + ",null,null);"
            console.log(sql)
            mssql.query(sql, function (err, result) {
                if (err) {
                    return res.send({ 'success': false, 'message': 'Error al insertar los datos' });
                } else {
                    return res.send({ 'success': true, 'message': 'OK' });
                }
            })

        } catch (err) {
            console.error('Error:', err.message);
            return res.send({ 'success': false, 'message': 'Error en la consulta' });
        }

    } catch (err) {
        console.error('Error:', err.message);
        return res.send({ 'success': false, 'message': 'Error en la conexión: ' + err.message });
    }
});

router.post('/comprobacionRegistro', async function (req, res, next) {
    var correo = req.body.correo;
    var dni = req.body.dni;
    var tipo = req.body.tipo;

    try {
        await mssql.connect(config);

        try {
            var result = await mssql.query("SELECT * FROM [dbo].[Usuarios] WHERE dni = '" + dni + "' and tipo = '" + tipo + "';")

            if (result.recordset.length > 0) {
                return res.send({ 'success': false, 'message': 'Ya existe un usuario con ese DNI' });
            }
            else {
                result = await mssql.query("SELECT * FROM [dbo].[Usuarios] WHERE correo = '" +correo+ "' and tipo = '" +tipo+ "';")

                if (result.recordset.length > 0) {
                    return res.send({ 'success': false, 'message': 'Ya existe un usuario con ese correo' });
                }
                else {
                    return res.send({ 'success': true, 'message': 'OK' });
                }
            }
        } catch (err) {
            return res.send({ 'success': false, 'message': 'Error en la consulta' });
        }

    } catch (err) {
        return res.send({ 'success': false, 'message': 'Error en la conexión: ' + err.message });
    }
});

router.get('/centros', async (req, res) => {
    try {
        await mssql.connect(config);

        console.log('Conexion bien');
        const lista = []

        try {
            const result = await mssql.query("SELECT * FROM [dbo].[Centros];")
            console.log(result)
            for (var i = 0; i < result.recordset.length; i++) {
                var resultado = result.recordset[i];
                console.log(resultado);
                lista.push({ label: resultado.nombre + ': ' + resultado.direccion, value: resultado.id })
            }
            return res.send({ 'success': true, 'lista': lista });

        } catch (err) {
            console.error('Error:', err.message);
            return res.send({ 'success': false, 'message': 'Error en la consulta' });
        }

    } catch (err) {
        console.error('Error:', err.message);
        return res.send({ 'success': false, 'message': 'Error en la conexión: ' + err.message });
    }
})

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: "smtp.gmail.com",
    auth: auth,
});

async function verificarTransporte(req, res, next) {
    try {
        console.log(process.env.CORREO)
        console.log(process.env.PASS)
        console.log(transporter)
        transporter.verify();
        console.log("Transporte de correo verificado y listo.");
        next();
    } catch (error) {
        console.error("Error en la verificación del transporte:", error);
        res.status(500).send('Error al configurar el transporte de correo.');
    }
}

router.post('/enviar-correo', verificarTransporte, async (req, res) => {
    const { destinatario, mensaje, token } = req.body;

    var fecha = new Date();
    fecha.setHours(fecha.getHours() + 1);
    console.log()

    const mailOptions = {
        from: process.env.CORREO,
        to: destinatario,
        subject: 'Recuperacion contraseña',
        text: mensaje,
    };

    try {
        await mssql.connect(config);

        console.log('Conexion bien');

        try {


            var sql = "UPDATE [dbo].[Usuarios] set codigo_recuperacion = '" +
                token + "', caducidad_codigo = '" + formatDateToISOString(fecha) + "' where correo = '" +
                destinatario + "';"
            console.log(sql)
            mssql.query(sql, function (err, result) {
                if (err) {
                    console.log(err)
                    return res.send({ 'success': false, 'message': 'Error al insertar los datos' });
                } else {

                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            console.error('Error al enviar el correo:', error);
                            return res.send({ 'success': false, 'message': 'Error al enviar el correo' });
                        } else {
                            console.log('Correo enviado:', info.response);
                            return res.send({ 'success': true, 'message': 'Correo enviado exitosamente' });
                        }
                    });

                }
            })

        } catch (err) {
            console.error('Error:', err.message);
            return res.send({ 'success': false, 'message': 'Error en la consulta' });
        }

    } catch (err) {
        console.error('Error:', err.message);
        return res.send({ 'success': false, 'message': 'Error en la conexión: ' + err.message });
    }


});

router.post('/reset-contra', async (req, res) => {
    const { correo, password, token } = req.body;
    var fecha = new Date();

    const pass = bcrypt.hashSync(password, hash)
    try {
        await mssql.connect(config);

        console.log('Conexion bien');

        try {
            var sql = "UPDATE [dbo].[Usuarios] set password = '" +
                pass + "' where correo = '" + correo + "' and codigo_recuperacion = '" +
                token + "' and caducidad_codigo >= '" + formatDateToISOString(fecha) + "';"
            console.log(sql)
            var result = await mssql.query(sql);

            if (result.rowsAffected[0] > 0) {
                return res.send({ 'success': true, 'message': 'Registro actualizado exitosamente' });
            } else {
                return res.send({ 'success': false, 'message': 'El token es incorrecto o ha caducado' });
            }

        } catch (err) {
            console.error('Error:', err.message);
            return res.send({ 'success': false, 'message': 'Error en la consulta' });
        }

    } catch (err) {
        console.error('Error:', err.message);
        return res.send({ 'success': false, 'message': 'Error en la conexión: ' + err.message });
    }


});



module.exports = router;
