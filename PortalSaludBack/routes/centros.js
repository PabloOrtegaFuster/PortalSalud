var express = require('express');
var router = express.Router();
var mssql = require('mssql');
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

const ajustarPacientesSinCentro = async () => {
    var query = "SELECT id, medico FROM [dbo].[Usuarios] where centro is null and tipo != 'Administrador'";
    console.log(123)
    const result = await mssql.query(query)

    if (result.recordset.length > 0) {

        console.log(result)
        for (var i = 0; i < result.recordset.length; i++) {
            console.log(i)
            console.log(result.recordset.length)
            var id_paciente = result.recordset[i].id
            var medico = result.recordset[i].medico
            const result2 = await mssql.query("SELECT centro FROM [dbo].[Usuarios] where id = " + medico)

            console.log(result2)

            var centro = result2.recordset[0].centro;


            await mssql.query("UPDATE [dbo].[Usuarios] set centro = " + centro + " where id = " + id_paciente + ";")
            console.log("ajustado")
        }
    }
}

const ajustarMedicosSinCentro = async () => {
    var query = "SELECT id FROM [dbo].[Usuarios] where tipo = 'Medico' and centro is null;"

    const result = await mssql.query(query)

    if (result.recordset.length > 0) {
        console.log(result)
        for (var i = 0; i < result.recordset.length; i++) {
            console.log(i)
            console.log(result.recordset.length)
            var id_medico = result.recordset[i].id
            const result2 = await mssql.query("SELECT count(m.id) as medicos, c.id FROM [dbo].[Usuarios] m, [dbo].[Centros] c where c.id = m.centro and m.tipo = 'Medico' group by c.id")

            console.log(result2)

            var centro = result2.recordset[0].id;
            var minmedicos = result2.recordset[0].medicos;
            for (var k = 0; k < result2.recordset.length; k++) {
                centroaux = result2.recordset[k].id;
                console.log(result2.recordset[k].medicos)
                console.log(minmedicos)
                if (result2.recordset[k].medicos < minmedicos) {
                    minmedicos = result2.recordset[k].medicos
                    centro = result2.recordset[k].id
                }


            }

            await mssql.query("UPDATE [dbo].[Usuarios] set centro = " + centro + " where id = " + id_medico + ";")
            console.log("ajustado")
        }
    }
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

                const newAccessToken = jwt.sign({ id: user.id, tipo: user.tipo }, process.env.ACCESS_SECRET, { expiresIn: '15m' });
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
    try {
        await mssql.connect(config);

        console.log('Conexion bien');
        const lista = []

        try {
            var query = "select id, nombre, direccion, localidad from [dbo].[Centros];"
            console.log(query);
            const result = await mssql.query(query)

            for (var i = 0; i < result.recordset.length; i++) {
                var resultado = result.recordset[i];
                console.log(resultado);
                lista.push({ id: resultado.id, nombre: resultado.nombre, direccion: resultado.direccion, localidad: resultado.localidad })
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

    try {
        await mssql.connect(config);

        console.log('Conexion bien');

        try {
            var query = "select nombre, direccion, localidad from [dbo].[Centros] where id = " + id + ";"
            console.log(query);
            var result = await mssql.query(query)

            if (result.recordset.length > 0) {
                return res.send({
                    'success': true, 'nombre': result.recordset[0].nombre, 'direccion': result.recordset[0].direccion,
                    'localidad': result.recordset[0].localidad,
                    'accessToken': req.newAccessToken,
                    'refreshToken': req.newRefreshToken
                });
            }
            else {
                return res.send({
                    'success': false, 'message': 'No existe ese centro',
                    'accessToken': req.newAccessToken,
                    'refreshToken': req.newRefreshToken
                });
            }


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

router.post('/borrar', verifyAndRenewToken, async (req, res) => {
    var id = req.body.id;

    try {
        await mssql.connect(config);

        console.log('Conexion bien');

        try {



            var query = "UPDATE [dbo].[Usuarios] set centro = null where centro = " + id + ";"
            console.log(query);

            mssql.query(query);
            

            query = "DELETE FROM [dbo].[Centros] where id = " + id + ";"
            console.log(query);

            mssql.query(query, async function (err, result) {
                if (err) {
                    return res.send({
                        'success': false, 'message': 'Error borrar el centro',
                        'accessToken': req.newAccessToken,
                        'refreshToken': req.newRefreshToken
                    });
                } else {
                    await ajustarMedicosSinCentro();
                    await ajustarPacientesSinCentro();
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

router.post('/crear', verifyAndRenewToken, async (req, res) => {
    var nombre = req.body.nombre;
    var direccion = req.body.direccion;
    var localidad = req.body.localidad;

    try {
        await mssql.connect(config);

        console.log('Conexion bien');
        const lista = []

        try {
            var query = "insert into [dbo].[Centros] values('" + nombre + "','" + direccion + "','" + localidad + "');"
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

router.post('/modificar', verifyAndRenewToken, async function (req, res, next) {
    var id = req.body.id;
    var nombre = req.body.nombre;
    var direccion = req.body.direccion;
    var localidad = req.body.localidad;

    try {
        await mssql.connect(config);

        console.log('Conexion bien');

        try {

            var sql = "UPDATE [dbo].[Centros] set nombre = '" + nombre +
                "', direccion = '" + direccion + "', localidad = '" + localidad +
                "' where id = " + id + ";"


            mssql.query(sql, function (err, result) {
                if (err) {
                    return res.send({
                        'success': false, 'message': 'Error al actualizar los datos',
                        'accessToken': req.newAccessToken,
                        'refreshToken': req.newRefreshToken
                    });
                }
                else {
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
});

module.exports = router;
