const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors'); 
const createError = require('http-errors');
const mssql = require('mssql');
require('dotenv').config();

var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');
var recetasRouter = require('./routes/recetas');
var centrosRouter = require('./routes/centros');
var medicamentosRouter = require('./routes/medicamentos');
var tomasRouter = require('./routes/tomas');
var citasRouter = require('./routes/citas');
var solicitudesRouter = require('./routes/solicitudes');
var usersRouter = require('./routes/users');

const PORT = process.env.PORT || 8008;

async function tryConnection() {
  var config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
      encrypt: true, 
      enableArithAbort: true,
    },
  };

  while (true) {
    try {
      await mssql.connect(config);

      console.log('Conexion bien');

      try {
        const result = await mssql.query("SELECT * FROM Usuarios;")

        if (result.recordset.length > 0) {
          console.log('Funciona bien la select');
          return;
        } else {
          console.log('Funciona mal la select');
          return;
        }
      } catch (err) {
        console.error('Error:', err.message);
      }



    } catch (err) {
      console.error('Error:', err.message);
    }
  }
}


var app = express();

app.use(cors());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/recetas', recetasRouter);
app.use('/centros', centrosRouter);
app.use('/medicamentos', medicamentosRouter);
app.use('/solicitudes', solicitudesRouter);
app.use('/citas', citasRouter);
app.use('/tomas', tomasRouter);
app.use('/users', usersRouter);

app.get('/hola', (req, res) => {
  console.log('Hello World!')
  return res.send('Hello World!')
})

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error', { 'title': 'Error' });
});

console.log('12345');

// Iniciar el servidor
app.listen(PORT, '0.0.0.0',() => {
  tryConnection();
  console.log(`Servidor Express.js corriendo en ` + PORT);
});

module.exports = app;
