require('dotenv').config();
const msal = require('@azure/msal-node');
const jwt = require('jsonwebtoken');
const prisma = require('../db/cliente');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecreto';

// base pública (prod o local) y base path de tu app
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';
const APP_BASE_PATH = '/reto3/seguridad/umg2025';

// no cambiamos la lógica, solo armamos URLs con base pública
const REDIRECT_AFTER_LOGIN = `${APP_BASE_PATH}/protegido/protegido.html`;

const cca = new msal.ConfidentialClientApplication({
  auth: {
    clientId: process.env.AZURE_CLIENT_ID,
    authority: process.env.AZURE_AUTHORITY,
    clientSecret: process.env.AZURE_CLIENT_SECRET
  }
});

const SCOPES = ['openid', 'profile', 'email', 'User.Read'];
const REDIRECT_URI = process.env.AZURE_REDIRECT_URL;

// ====== INICIO SESIÓN ======
async function loginAzure(req, res, next) {
  try {
    const url = await cca.getAuthCodeUrl({
      scopes: SCOPES,
      redirectUri: REDIRECT_URI,
      prompt: 'select_account'
    });
    res.redirect(url);
  } catch (error) {
    next(error);
  }
}

// ====== CALLBACK ======
async function callback(req, res, next) {
  try {
    const tokenResponse = await cca.acquireTokenByCode({
      code: req.query.code,
      scopes: SCOPES,
      redirectUri: REDIRECT_URI
    });

    const acc = tokenResponse.account;
    const email = acc.username;
    const name = acc.name || email;
    const microsoftID = acc.homeAccountId;

    let usuarioexiste = await prisma.usuario.findUnique({ where: { correo: email } });

    if (!usuarioexiste) {
      usuarioexiste = await prisma.usuario.create({
        data: { correo: email, nombre: name, proveedor: 'azure', microsoftID }
      });
    } else if (
      usuarioexiste.proveedor !== 'azure' ||
      usuarioexiste.microsoftID !== microsoftID ||
      usuarioexiste.nombre !== name
    ) {
      usuarioexiste = await prisma.usuario.update({
        where: { id: usuarioexiste.id },
        data: { proveedor: 'azure', microsoftID, nombre: name }
      });
    }

    const jwtToken = jwt.sign(
      { id: usuarioexiste.id, correo: usuarioexiste.correo, name: usuarioexiste.nombre },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const url = `${REDIRECT_AFTER_LOGIN}#token=${encodeURIComponent(jwtToken)}`;
    return res.redirect(url);
  } catch (error) {
    next(error);
  }
}

// ====== LOGOUT (sin localhost) ======
function logout(req, res) {
  const postLogout = encodeURIComponent(`${PUBLIC_BASE_URL}${APP_BASE_PATH}/logout-done`);
  const msLogoutUrl =
    `https://login.microsoftonline.com/common/oauth2/v2.0/logout?post_logout_redirect_uri=${postLogout}`;
  res.redirect(msLogoutUrl);
}

module.exports = { loginAzure, callback, logout };
