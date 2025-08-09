const {
    crearUsuario,
    login
} = require('../controller/usuario');
const express = require('express');

const rutas = express.Router();


//ruta para crear usuario de forma tradicional
rutas.post('/registrar/local', crearUsuario);

//ruta para login tradicional
rutas.post('/login/local', login);

module.exports = rutas;