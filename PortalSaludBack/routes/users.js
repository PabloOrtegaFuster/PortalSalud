var express = require('express');
var router = express.Router();
var mssql = require('mssql');
const jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs')
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

const hash = process.env.HASH

const ajustarSinMedico = async (centro) => {
    var query = "SELECT id FROM [dbo].[Usuarios] where medico is null and tipo = 'Paciente' and centro = " + centro + ";"

    const result = await mssql.query(query)

    if (result.recordset.length > 0) {
        console.log(result)
        for (var i = 0; i < result.recordset.length; i++) {
            console.log(i)
            console.log(result.recordset.length)
            var id_paciente = result.recordset[i].id
            const result2 = await mssql.query("SELECT id FROM [dbo].[Usuarios] where tipo = 'Medico' and centro = " + centro)
            
            console.log(result2)

            var medico = result2.recordset[0].id;
            var minpacientes;
            for (var k = 0; k < result2.recordset.length; k++) {
                medicoaux = result2.recordset[k].id;
                var resultaux = await mssql.query("SELECT count(*) as pacientes FROM [dbo].[Usuarios] where medico = " + medicoaux + " and centro = " + centro)
                if (k == 0) {
                    minpacientes = resultaux.recordset[0].pacientes
                }
                else {
                    if (resultaux.recordset[0].pacientes < minpacientes) {
                        medico = medicoaux
                    }
                }

            }

            await mssql.query("UPDATE [dbo].[Usuarios] set medico = " + medico + " where id = " + id_paciente + ";")
            console.log("ajustado")
        }
    }
}

async function verifyAndRenewToken(req, res, next) {
    const token = req.headers['authorization'];

    console.log(req.headers)
    console.log(token)
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
                console.log(refreshToken)
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

router.get('/medicoPaciente', verifyAndRenewToken, async function (req, res) {
    var id = req.body.id;


    try {
        await mssql.connect(config);

        console.log('Conexion bien');

        try {

            var result = await mssql.query("SELECT * FROM [dbo].[Usuarios] WHERE id = " + id + ";")

            if (result.recordset.length > 0) {


                return res.send({
                    'success': true, 'medico': result.recordset[0].medico,
                    'accessToken': req.newAccessToken,
                    'refreshToken': req.newRefreshToken
                });
            } else {
                return res.send({
                    'success': false, 'message': 'Usuario o contraseña incorrectos',
                    'accessToken': req.newAccessToken,
                    'refreshToken': req.newRefreshToken
                });
            }
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

router.post('/listado', verifyAndRenewToken, async (req, res) => {
    var id = req.body.id;
    var tipo = req.body.tipo;
    try {
        console.log
        await mssql.connect(config);

        console.log('Conexion bien');
        const lista = []

        try {
            console.log(id)
            if (id === undefined)
                var query = "SELECT id, nombre, apellidos, centro FROM [dbo].[Usuarios] where tipo = '" + tipo + "';"
            else
                var query = "SELECT id, nombre, apellidos FROM [dbo].[Usuarios] where medico = " + id + ";"
            console.log(query)
            const result = await mssql.query(query)

            console.log(456);
            for (var i = 0; i < result.recordset.length; i++) {
                var resultado = result.recordset[i];

                lista.push({
                    id: resultado.id,
                    usuario: resultado.nombre + " " + resultado.apellidos,
                })
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

router.post('/listadoMedicos', verifyAndRenewToken, async (req, res) => {
    try {
        console.log
        await mssql.connect(config);

        console.log('Conexion bien');
        const lista = []

        try {
            var query = "SELECT id, nombre, apellidos, centro FROM [dbo].[Usuarios] where tipo = 'Medico';"

            console.log(query)
            const result = await mssql.query(query)

            console.log(456);
            for (var i = 0; i < result.recordset.length; i++) {
                var resultado = result.recordset[i];

                lista.push({
                    value: resultado.id,
                    label: resultado.nombre + " " + resultado.apellidos,
                    centro: resultado.centro
                })
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
        console.log()
        try {
            var query = "SELECT p.nombre, p.apellidos, p.correo, p.fecha_nacimiento, p.dni, p.telefono, p.centro as centroid, p.tipo, p.medico as medicoid, (c.nombre + ' ' + c.direccion) as centro, (m.nombre + ' ' + m.apellidos) as medico  " +
                " FROM [dbo].[Usuarios] p, [dbo].[Usuarios] m, [dbo].[Centros] c where p.id = '" + id + "';"
            console.log(query);

            const result = await mssql.query(query)


            if (result.recordset.length > 0) {
                var lista = [];
                var horario = [];
                if (result.recordset[0].tipo == "Paciente") {
                    query = "SELECT id, nombre, apellidos, centro FROM [dbo].[Usuarios] where tipo = 'Medico';"
                    console.log(query);

                    const result2 = await mssql.query(query)

                    for (var i = 0; i < result2.recordset.length; i++) {
                        var resultado = result2.recordset[i];
                        console.log(resultado)
                        lista.push({
                            value: resultado.id,
                            label: resultado.nombre + " " + resultado.apellidos,
                            centro: resultado.centro
                        })
                    }
                }

                if (result.recordset[0].tipo == "Medico") {
                    query = "SELECT dia_semana, CONVERT(VARCHAR(5), hora_inicio, 108) as hora_inicio, CONVERT(VARCHAR(5), hora_fin, 108) as hora_fin FROM [dbo].[HorariosMedicos] where medico_id = " + id +
                        " ORDER BY CASE dia_semana WHEN 'Lunes' THEN 1 WHEN 'Martes' THEN 2 WHEN 'Miércoles' THEN 3 WHEN 'Jueves' THEN 4 WHEN 'Viernes' THEN 5 END;"
                    console.log(query);

                    const result2 = await mssql.query(query)

                    for (var i = 0; i < result2.recordset.length; i++) {
                        var resultado = result2.recordset[i];
                        console.log(resultado)
                        horario.push({
                            id: i + 1,
                            day: resultado.dia_semana,
                            startTime: resultado.hora_inicio,
                            endTime: resultado.hora_fin
                        })
                    }
                }

                return res.send({
                    'success': true, 'nombre': result.recordset[0].nombre, 'apellidos': result.recordset[0].apellidos,
                    'correo': result.recordset[0].correo,
                    'fecha_nacimiento': result.recordset[0].fecha_nacimiento,
                    'dni': result.recordset[0].dni, 'telefono': result.recordset[0].telefono,
                    'centro': result.recordset[0].centro,
                    'centroid': result.recordset[0].centroid,
                    'medicoid': result.recordset[0].medicoid,
                    'medico': result.recordset[0].medico,
                    'lista': lista,
                    'horario': horario,
                    'accessToken': req.newAccessToken,
                    'refreshToken': req.newRefreshToken
                });
            } else {
                return res.send({
                    'success': false, 'message': 'Usuario o contraseña incorrectos',
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
    var centro;
    try {
        await mssql.connect(config);

        console.log('Conexion bien');

        try {

            

            var query = "SELECT centro from [dbo].[Usuarios] where id = " + id + ";"
            console.log(query);

            const resultcentro = await mssql.query(query)

            if (resultcentro.recordset.length > 0) {
                centro = resultcentro.recordset[0].centro;
            }

            var query = "UPDATE [dbo].[Usuarios] set medico = null where medico = " + id + ";"
            console.log(query);

            await mssql.query(query, function (err, result) {
                if (err) {
                    return res.send({
                        'success': false, 'message': 'Error borrar el usuario',
                        'accessToken': req.newAccessToken,
                        'refreshToken': req.newRefreshToken
                    });
                }

            })

            query = "DELETE FROM [dbo].[Alarmas] where usuario_id = " + id + ";"
            console.log(query);

            await mssql.query(query, function (err, result) {
                if (err) {
                    return res.send({
                        'success': false, 'message': 'Error borrar el usuario',
                        'accessToken': req.newAccessToken,
                        'refreshToken': req.newRefreshToken
                    });
                }
            })

            query = "DELETE FROM [dbo].[Citas] where paciente_id = " + id + " or medico_id = " + id + ";"
            console.log(query);

            await mssql.query(query, function (err, result) {
                if (err) {
                    return res.send({
                        'success': false, 'message': 'Error borrar el usuario',
                        'accessToken': req.newAccessToken,
                        'refreshToken': req.newRefreshToken
                    });
                }
            })

            query = "DELETE FROM [dbo].[Recetas] where paciente_id = " + id + ";"
            console.log(query);

            await mssql.query(query, function (err, result) {
                if (err) {
                    return res.send({
                        'success': false, 'message': 'Error borrar el usuario',
                        'accessToken': req.newAccessToken,
                        'refreshToken': req.newRefreshToken
                    });
                }
            })

            query = "DELETE FROM [dbo].[Tokens] where usuarioid = " + id + ";"
            console.log(query);

            await mssql.query(query, function (err, result) {
                if (err) {
                    return res.send({
                        'success': false, 'message': 'Error borrar el usuario',
                        'accessToken': req.newAccessToken,
                        'refreshToken': req.newRefreshToken
                    });
                }
            })

            query = "DELETE FROM [dbo].[Usuarios] where id = " + id + ";"
            console.log(query);

            await mssql.query(query, async function (err, result) {
                if (err) {

                    console.log(err)
                    return res.send({
                        'success': false, 'message': 'Error borrar el usuario',
                        'accessToken': req.newAccessToken,
                        'refreshToken': req.newRefreshToken
                    });
                }
                else {
                    console.log(123)
                    await ajustarSinMedico(centro)

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


router.post('/comprobacionUpdate', verifyAndRenewToken, async function (req, res, next) {
    var correo = req.body.correo;
    var dni = req.body.dni;
    var tipo = req.body.tipo;

    console.log(req.ip)

    try {
        await mssql.connect(config);

        console.log('Conexion bien');

        try {
            var result = await mssql.query("SELECT * FROM [dbo].[Usuarios] WHERE correo = '" + correo + "' and tipo = '" + tipo + "' and dni != '" + dni + "';")

            if (result.recordset.length > 0) {
                return res.send({
                    'success': false, 'message': 'Ya existe un usuario con ese correo',
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


router.post('/registroMedico', verifyAndRenewToken, async function (req, res, next) {

    const { nombre, apellidos, correo, password, fechaNacimiento, dni, telefono, centro, horarios } = req.body;
    const hashedPassword = bcrypt.hashSync(password, hash);

    try {
        await mssql.connect(config);

        console.log('Conexion bien');

        try {

            const insertUserQuery = `
            INSERT INTO [dbo].[Usuarios] (nombre, apellidos, correo, password, fecha_nacimiento, dni, telefono, tipo, centro)
            VALUES (@nombre, @apellidos, @correo, @password, @fechaNacimiento, @dni, @telefono, 'Medico', @centro);
            `;

            const requestInsertUser = new mssql.Request();
            requestInsertUser.input('nombre', mssql.NVarChar, nombre);
            requestInsertUser.input('apellidos', mssql.NVarChar, apellidos);
            requestInsertUser.input('correo', mssql.NVarChar, correo);
            requestInsertUser.input('password', mssql.NVarChar, hashedPassword);
            requestInsertUser.input('fechaNacimiento', mssql.Date, fechaNacimiento);
            requestInsertUser.input('dni', mssql.NVarChar, dni);
            requestInsertUser.input('telefono', mssql.NVarChar, telefono);
            requestInsertUser.input('centro', mssql.Int, centro);

            await requestInsertUser.query(insertUserQuery);

            const userQuery = `
            SELECT id FROM [dbo].[Usuarios] WHERE correo = @correo AND dni = @dni;
          `;
            const requestUserQuery = new mssql.Request();
            requestUserQuery.input('correo', mssql.NVarChar, correo);
            requestUserQuery.input('dni', mssql.NVarChar, dni);

            const userResult = await requestUserQuery.query(userQuery);
            const user = userResult.recordset[0];

            if (!user) {
                return res.send({
                    'success': false, 'message': 'Usuario no encontrado',
                    'accessToken': req.newAccessToken,
                    'refreshToken': req.newRefreshToken
                });
            }


            for (const horario of horarios) {
                console.log(horario.startTime)
                var query = "INSERT INTO HorariosMedicos (medico_id, dia_semana, hora_inicio, hora_fin)" +
                    "VALUES (" + user.id + ", '" + horario.day + "', '" + horario.startTime + ":00', '" + horario.endTime + ":00');"
                console.log(query)
                await mssql.query(query);
            }

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

router.post('/registroAdministrador', verifyAndRenewToken, async function (req, res, next) {
    var nombre = req.body.nombre;
    var apellidos = req.body.apellidos;
    var correo = req.body.correo;
    var password = bcrypt.hashSync(req.body.password, hash);
    var fechaNacimiento = req.body.fechaNacimiento;
    var dni = req.body.dni;
    var telefono = req.body.telefono;

    try {
        await mssql.connect(config);

        console.log('Conexion bien');

        try {

            var sql = "INSERT INTO [dbo].[Usuarios] VALUES('" + nombre +
                "','" + apellidos + "','" + correo + "','" + password + "','" + fechaNacimiento +
                "','" + dni + "','" + telefono + "','Administrador',null,null,null,null);"
            console.log(sql)
            mssql.query(sql, function (err, result) {
                if (err) {
                    return res.send({ 'success': false, 'message': 'Error al insertar los datos' });
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
});

router.post('/modificar', verifyAndRenewToken, async function (req, res, next) {
    var nombre = req.body.nombre;
    var apellidos = req.body.apellidos;
    var correo = req.body.correo;
    var fechaNacimiento = req.body.fechaNacimiento;
    var id = req.body.id;
    var telefono = req.body.telefono;
    var centro = req.body.centro;
    var medico = req.body.medico;
    var tipo = req.body.tipo;
    var horarios = req.body.horarios;
    var centroaux;

    try {
        await mssql.connect(config);

        console.log('Conexion bien');

        try {

            if (tipo === "Medico") {
                var query = "SELECT centro from [dbo].[Usuarios] where id = " + id + ";"
                console.log(query);

                const resultcentro = await mssql.query(query)

                if (resultcentro.recordset.length > 0) {
                    centroaux = resultcentro.recordset[0].centro;
                }

                console.log(horarios)

                for (const horario of horarios) {
                    console.log(horario.startTime)
                    var query = "UPDATE HorariosMedicos set hora_inicio = '" + horario.startTime + ":00', hora_fin = '" + horario.endTime + ":00' " +
                        "WHERE medico_id = " + id + " and dia_semana = '" + horario.day + "'"
                    console.log(query)
                    await mssql.query(query);
                }
            }


            var sql = "UPDATE [dbo].[Usuarios] set nombre = '" + nombre +
                "', apellidos = '" + apellidos + "', correo = '" + correo +
                "', fecha_nacimiento = '" + fechaNacimiento +
                "', telefono = '" + telefono;



            if (centro === null) {

                sql = sql +
                    "', centro = null"
            }
            else {

                sql = sql +
                    "', centro = " + centro
            }

            if (tipo === "Paciente") {
                sql = sql + ", medico = " + medico
            }

            sql = sql +
                " where id = " + id + ";"

            console.log(sql)
            mssql.query(sql, function (err, result) {
                if (err) {
                    return res.send({
                        'success': false, 'message': 'Error al actualizar los datos',
                        'accessToken': req.newAccessToken,
                        'refreshToken': req.newRefreshToken
                    });
                }
            })

            if (tipo === "Medico" && centroaux !== centro) {
                await mssql.query("UPDATE [dbo].[Usuarios] set medico = null where medico = " + id + ";")

                await mssql.query("DELETE FROM [dbo].[Citas] where medico_id = " + id + ";")

                ajustarSinMedico(centroaux)
                ajustarSinMedico(centro)
            }
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

router.post('/horarioMedico', verifyAndRenewToken, async (req, res) => {

    var id = req.body.id;

    try {
        console.log
        await mssql.connect(config);

        console.log('Conexion bien');
        const lista = []

        try {
            var query = "SELECT * FROM [dbo].[HorariosMedicos] where medico_id = " + id +
                " ORDER BY CASE dia_semana WHEN 'Lunes' THEN 1 WHEN 'Martes' THEN 2 WHEN 'Miércoles' THEN 3 WHEN 'Jueves' THEN 4 WHEN 'Viernes' THEN 5 END;"

            console.log(query)
            const result = await mssql.query(query)

            for (var i = 0; i < result.recordset.length; i++) {
                var resultado = result.recordset[i];

                lista.push({
                    value: resultado.id,
                    dia: resultado.dia_semana,
                    hora_inicio: new Date(resultado.hora_inicio).getUTCHours(),
                    hora_fin: new Date(resultado.hora_fin).getUTCHours(),
                })
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

module.exports = router;
