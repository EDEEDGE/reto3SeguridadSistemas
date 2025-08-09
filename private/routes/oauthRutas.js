const express = require('express');
const rutas = express.Router();

const {
    loginAzure,
    callback,
    logout
} = require('../controller/oauth');

//iniciar sesion con microsoft
rutas.get('/auth/azure/login', loginAzure);

//callback de azure
rutas.get('/reto3/seguridad/umg2025/auth/azure/callback', callback);

//logout local
rutas.get('/logout', logout);

module.exports = rutas;