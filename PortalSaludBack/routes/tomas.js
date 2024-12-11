var express = require('express');
var router = express.Router();
var mssql = require('mssql');
const moment = require('moment');
const jwt = require('jsonwebtoken');
require('dotenv').config()


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

router.post('/listado', async (req, res) => {
    var id = req.body.id;
    var fecha = new Date();
    fecha.setHours(fecha.getHours() + offSet(fecha))
    try {
        await mssql.connect(config);

        console.log('Conexion bien');
        const lista = []

        const fechaActual = fecha.toISOString().split('T')[0]; 
        console.log(1)
        const horaActual = fecha.getHours();
        console.log(2)
        const minutosActuales = fecha.getMinutes();
        console.log(3)

        await mssql.query`
            DELETE FROM Alarmas
            WHERE 
                fin < ${fechaActual} OR 
                (fin = ${fechaActual} AND (hora < ${horaActual} OR (hora = ${horaActual} AND minutos < ${minutosActuales})))
        `;


        try {

            console.log(123);
            var query = "SELECT id, descripcion, hora, minutos, fin, id_receta FROM [dbo].[Alarmas] where usuario_id = " + id + " and fin > '" + formatDate(new Date()) + "';"
            console.log(query);
            const result = await mssql.query(query)

            console.log(456);
            for (var i = 0; i < result.recordset.length; i++) {
                var resultado = result.recordset[i];
                var hora = resultado.hora, minutos = resultado.minutos
                if (hora.toString().length == 1) {
                    hora = '0' + hora;
                }
                if (minutos.toString().length == 1) {
                    minutos = '0' + minutos;
                }
                console.log(resultado);
                console.log(789);
                lista.push({ id: resultado.id, id_alarma: resultado.id, descripcion: resultado.descripcion, hora: hora, minutos: minutos, fin: resultado.fin, id_receta: resultado.id_receta })
                console.log(10);
            }
            return res.send({ 'success': true, 'lista': lista });

        } catch (err) {
            console.error('Error 2:', err.message);
            return res.send({ 'success': false, 'message': 'Error en la consulta' });
        }

    } catch (err) {
        console.error('Error 1:', err.message);
        return res.send({ 'success': false, 'message': 'Error en la conexión: ' + err.message });
    }
})

router.post('/listadoRecetas', async (req, res) => {
    var id = req.body.id;
    var fecha = formatDate(new Date());
    try {
        await mssql.connect(config);

        console.log('Conexion bien');
        const lista = []

        try {
            var query = "SELECT distinct m.nombre, r.id FROM [dbo].[Recetas] r, [dbo].[Medicamentos] m where id_paciente = " + id + " and r.id_medicamento = m.id and fecha_fin >= '" + fecha + "' and fecha_inicio <= '" + fecha + "';"
            console.log(query);
            const result = await mssql.query(query)

            for (var i = 0; i < result.recordset.length; i++) {
                var resultado = result.recordset[i];
                console.log(resultado);
                lista.push({ value: resultado.nombre, label: resultado.nombre, id: resultado.id })
            }
            return res.send({ 'success': true, 'lista': lista });

        } catch (err) {
            console.error('Error 2:', err.message);
            return res.send({ 'success': false, 'message': 'Error en la consulta' });
        }

    } catch (err) {
        console.error('Error 1:', err.message);
        return res.send({ 'success': false, 'message': 'Error en la conexión: ' + err.message });
    }
})

router.post('/detalle', async (req, res) => {
    var id = req.body.id;

    var medicamento = "";
    var hora = "";
    var minutos = "";
    var receta = "";
    try {
        await mssql.connect(config);

        console.log('Conexion bien');
        const lista = []

        try {
            var query = "select m.nombre, r.id as receta_id, a.fin, a.hora, a.minutos from [dbo].[Alarmas] a, [dbo].[Recetas] r, [dbo].[Medicamentos] m where a.id = " + id + " and a.id_receta = r.id  and r.id_medicamento = m.id;"
            console.log(query);
            var result = await mssql.query(query)

            if (result.recordset.length > 0) {
                medicamento = result.recordset[0].nombre;
                hora = result.recordset[0].hora;
                minutos = result.recordset[0].minutos;
                receta = result.recordset[0].receta_id;
                fecha_fin = moment(result.recordset[0].fin).format('DD/MM/YYYY');
            }

            return res.send({
                'success': true, 'medicamento': medicamento, 'hora': hora, 'minutos': minutos,
                'receta': receta, 'fecha_fin': fecha_fin
            });

        } catch (err) {
            console.error('Error 2:', err.message);
            return res.send({ 'success': false, 'message': 'Error en la consulta' });
        }

    } catch (err) {
        console.error('Error 1:', err.message);
        return res.send({ 'success': false, 'message': 'Error en la conexión: ' + err.message });
    }
})

router.post('/crear', async (req, res) => {
    var id = req.body.id;
    var fin = req.body.fin;
    var hora = req.body.hora;
    var minutos = req.body.minutos;
    var descripcion = req.body.descripcion;
    var id_receta = req.body.id_receta;

    try {
        await mssql.connect(config);

        console.log('Conexion bien');
        const lista = []

        try {
            var query = "insert into [dbo].[Alarmas] values(" + id + "," + hora + "," + minutos + ",'" + fin + "','" + descripcion + " " + hora + ":" + minutos + "'," + id_receta + ");"
            console.log(query);

            mssql.query(query, function (err, result) {
                if (err) {
                    return res.send({ 'success': false, 'message': 'Error al insertar los datos' });
                } else {
                    return res.send({ 'success': true, 'message': 'OK' });
                }
            })

        } catch (err) {
            console.error('Error 2:', err.message);
            return res.send({ 'success': false, 'message': 'Error en la consulta' });
        }

    } catch (err) {
        console.error('Error 1:', err.message);
        return res.send({ 'success': false, 'message': 'Error en la conexión: ' + err.message });
    }
})

router.post('/borrar', async (req, res) => {
    var id = req.body.id;

    try {
        await mssql.connect(config);

        console.log('Conexion bien');

        try {
            var query = "DELETE FROM [dbo].[Alarmas]where id = " + id + ";"
            console.log(query);

            mssql.query(query, function (err, result) {
                if (err) {
                    return res.send({ 'success': false, 'message': 'Error al insertar los datos' });
                } else {
                    return res.send({ 'success': true, 'message': 'OK' });
                }
            })

        } catch (err) {
            console.error('Error 2:', err.message);
            return res.send({ 'success': false, 'message': 'Error en la consulta' });
        }

    } catch (err) {
        console.error('Error 1:', err.message);
        return res.send({ 'success': false, 'message': 'Error en la conexión: ' + err.message });
    }
})


module.exports = router;
