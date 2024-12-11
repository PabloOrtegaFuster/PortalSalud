var express = require('express');
var router = express.Router();
var mssql = require('mssql');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

const auth = {
    user: process.env.CORREO,
    pass: process.env.PASS,
}

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
    const tipo = req.body.tipo;
    try {
        await mssql.connect(config);

        console.log('Conexion bien');
        const lista = []

        try {
            var query = "SELECT s.*, p.nombre, p.apellidos FROM [dbo].[Solicitudes] s, [dbo].[Usuarios] p where estado = '" + tipo + "' and s.id_usuario = p.id"
            if (tipo == "Pendiente") {
                query = query + " order by fechaCreacion asc;"
            }
            else {
                query = query + " order by fechaCreacion desc;"
            }

            console.log(query);
            const result = await mssql.query(query)

            for (var i = 0; i < result.recordset.length; i++) {
                var resultado = result.recordset[i];
                console.log(resultado);
                lista.push({ id: resultado.id, usuario: resultado.id_usuario, nombre: resultado.nombre + " " + resultado.apellidos })
            }
            return res.send({
                'success': true, 'lista': lista,
                'accessToken': req.newAccessToken,
                'refreshToken': req.newRefreshToken
            });

        } catch (err) {
            console.error('Error 2:', err.message);
            return res.send({
                'success': false, 'message': 'Error en la consulta',
                'accessToken': req.newAccessToken,
                'refreshToken': req.newRefreshToken
            });
        }

    } catch (err) {
        console.error('Error 1:', err.message);
        return res.send({
            'success': false, 'message': 'Error en la conexión: ' + err.message,
            'accessToken': req.newAccessToken,
            'refreshToken': req.newRefreshToken
        });
    }
})


router.post('/detalle', verifyAndRenewToken, async (req, res) => {
    var id = req.body.id;

    var mensaje = "";
    var tipo = "";
    try {
        await mssql.connect(config);

        console.log('Conexion bien');

        try {
            var query = "select s.*, u.tipo from [dbo].[Solicitudes] s, [dbo].[Usuarios] u where s.id = " + id + " and s.id_usuario = u.id;"
            console.log(query);
            var result = await mssql.query(query)

            if (result.recordset.length > 0) {
                mensaje = result.recordset[0].mensaje;
                tipo = result.recordset[0].tipo;
            }

            return res.send({
                'success': true, 'mensaje': mensaje, 'tipo': tipo,
                'accessToken': req.newAccessToken,
                'refreshToken': req.newRefreshToken
            });

        } catch (err) {
            console.error('Error 2:', err.message);
            return res.send({
                'success': false, 'message': 'Error en la consulta',
                'accessToken': req.newAccessToken,
                'refreshToken': req.newRefreshToken
            });
        }

    } catch (err) {
        console.error('Error 1:', err.message);
        return res.send({
            'success': false, 'message': 'Error en la conexión: ' + err.message,
            'accessToken': req.newAccessToken,
            'refreshToken': req.newRefreshToken
        });
    }
})

router.post('/informacion', verifyAndRenewToken, async (req, res) => {
    var id = req.body.id;

    var medico = "";
    var centro = "";
    try {
        await mssql.connect(config);

        console.log('Conexion bien');
        const lista = []

        try {
            var query = "select m.id, m.nombre, m.apellidos from [dbo].[Usuarios] p, [dbo].[Usuarios] m where p.id = " + id + " and p.medico = m.id;"
            console.log(query);
            var result = await mssql.query(query)

            if (result.recordset.length > 0) {
                id = result.recordset[0].id;
                medico = result.recordset[0].nombre + " " + result.recordset[0].apellidos;
            }

            var query = "select * from [dbo].[Medicamentos];"
            console.log(query);
            result = await mssql.query(query)

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
            return res.send({
                'success': false, 'message': 'Error en la consulta',
                'accessToken': req.newAccessToken,
                'refreshToken': req.newRefreshToken
            });
        }

    } catch (err) {
        console.error('Error 1:', err.message);
        return res.send({
            'success': false, 'message': 'Error en la conexión: ' + err.message,
            'accessToken': req.newAccessToken,
            'refreshToken': req.newRefreshToken
        });
    }
})

router.post('/crear', verifyAndRenewToken, async (req, res) => {
    var id = req.body.id;
    var cambios = req.body.cambios;

    try {
        await mssql.connect(config);

        console.log('Conexion bien');

        try {

            var sql = "INSERT INTO [dbo].[Solicitudes] (id_usuario, mensaje, estado) VALUES(" + id +
                ",'" + cambios + "','Pendiente');"
            console.log(sql)
            mssql.query(sql, function (err, result) {
                if (err) {
                    return res.send({
                        'success': false, 'message': 'Error al insertar los datos',
                        'accessToken': req.newAccessToken,
                        'refreshToken': req.newRefreshToken
                    });
                } else {
                    return res.send({
                        'success': true, 'message': 'OK',
                        'accessToken': req.newAccessToken,
                        'refreshToken': req.newRefreshToken
                    });
                }
            })

        } catch (err) {
            console.error('Error:', err.message);
            return res.send({
                'success': false, 'message': 'Error en la consulta',
                'accessToken': req.newAccessToken,
                'refreshToken': req.newRefreshToken
            });
        }

    } catch (err) {
        console.error('Error:', err.message);
        return res.send({
            'success': false, 'message': 'Error en la conexión: ' + err.message,
            'accessToken': req.newAccessToken,
            'refreshToken': req.newRefreshToken
        });
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
                    return res.send({
                        'success': false, 'message': 'Error al insertar los datos',
                        'accessToken': req.newAccessToken,
                        'refreshToken': req.newRefreshToken
                    });
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
            return res.send({
                'success': false, 'message': 'Error en la consulta',
                'accessToken': req.newAccessToken,
                'refreshToken': req.newRefreshToken
            });
        }

    } catch (err) {
        console.error('Error 1:', err.message);
        return res.send({
            'success': false, 'message': 'Error en la conexión: ' + err.message,
            'accessToken': req.newAccessToken,
            'refreshToken': req.newRefreshToken
        });
    }
})

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: "smtp.gmail.com",
    auth: auth,
});

async function verificarTransporte(req, res, next) {
    try {
        transporter.verify();
        console.log("Transporte de correo verificado y listo.");
        next();
    } catch (error) {
        console.error("Error en la verificación del transporte:", error);
        res.status(500).send('Error al configurar el transporte de correo.');
    }
}

router.post('/modificar', verifyAndRenewToken, verificarTransporte, async function (req, res, next) {
    const { id, estado, usuario, cambios } = req.body;

    var destinatario

    try {
        await mssql.connect(config);

        console.log('Conexion bien');

        try {

            var sql = "UPDATE [dbo].[Solicitudes] set estado = '" + estado +
                "' where id = " + id + ";"

            await mssql.query(sql, function (err) {
                if (err) {
                    return res.send({
                        'success': false, 'message': 'Error al actualizar los datos',
                        'accessToken': req.newAccessToken,
                        'refreshToken': req.newRefreshToken
                    });
                }
            })

            sql =  "SELECT correo from [dbo].[Usuarios] where id = " + usuario + ";"

            const result = await mssql.query(sql)

            const mailOptions = {
                from: process.env.CORREO,
                to: result.recordset[0].correo,
                subject: 'Solicitud ' + estado,
                text: "Su solicitud sobre (" + cambios + ") ha sido procesada",
            };

            transporter.sendMail(mailOptions, (error) => {
                if (error) {
                    console.error('Error al enviar el correo:', error);
                    return res.send({ 'success': false, 'message': 'Error al enviar el correo' });
                }
            });

            return res.send({
                'success': true, 'message': 'OK',
                'accessToken': req.newAccessToken,
                'refreshToken': req.newRefreshToken
            });

        } catch (err) {
            console.error('Error:', err.message);
            return res.send({
                'success': false, 'message': 'Error en la consulta',
                'accessToken': req.newAccessToken,
                'refreshToken': req.newRefreshToken
            });
        }

    } catch (err) {
        console.error('Error:', err.message);
        return res.send({
            'success': false, 'message': 'Error en la conexión: ' + err.message,
            'accessToken': req.newAccessToken,
            'refreshToken': req.newRefreshToken
        });
    }
});




router.post('/enviar-correo', verificarTransporte, async (req, res) => {










});



module.exports = router;
