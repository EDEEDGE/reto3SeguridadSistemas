const express = require('express');
const rutas = express.Router();
const verificarJWT = require('../middleware/verificacion');
const {
    iniciarEnrolamiento2FA,
    confirmacion2FA,
    verificar2FAyEmitirJWT
} = require('../controller/2FA')

//ruta para el enrolamiento
rutas.post('/2fa/enroll', verificarJWT, iniciarEnrolamiento2FA);

//ruta de la confirmacion del 2fa 
rutas.post('/2fa/confirm', verificarJWT, confirmacion2FA);

//segunda fase del login local
rutas.post('/login/local/2fa', verificar2FAyEmitirJWT);

module.exports = rutas;