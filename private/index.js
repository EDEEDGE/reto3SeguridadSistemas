require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();

// Middleware para parsear JSON
app.use(express.json());

// Sirve archivos estáticos desde ../public
app.use('/reto3/seguridad/umg2025', express.static(path.join(__dirname, '../public')));

// Redirige '/' hacia la ruta principal
app.get('/', (req, res) => {
    res.redirect('/reto3/seguridad/umg2025');
});

// Tus rutas personalizadas

//login local
const rutasLocales = require('./routes/usuario');
app.use('/reto3/seguridad/umg2025', rutasLocales); // Asegúrate que tus rutas de API no choquen con los archivos estáticos

//login azure
const oauthRutas = require('./routes/oauthRutas');
app.use(oauthRutas);

//rutas 2fa
const rutas2fa = require('./routes/2FArutas');
app.use('/reto3/seguridad/umg2025', rutas2fa)


const cookieParser = require('cookie-parser');
app.use(cookieParser());
//limpiar el token del navegador despeus de hacer logout y regresar al inico
app.get('/reto3/seguridad/umg2025/logout-done', (req, res) => {
  res.set('Content-Type', 'text/html').send(`<!doctype html>
  <html lang="es"><head><meta charset="utf-8"><title>Cerrando sesión...</title></head>
  <body>
    <script>
      try { localStorage.removeItem('token'); } catch (e) {}
      window.location.href = '/reto3/seguridad/umg2025';
    </script>
  </body></html>`);
});

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
