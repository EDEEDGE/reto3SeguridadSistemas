require('dotenv').config();
const msal = require('@azure/msal-node');
const jwt = require('jsonwebtoken');
const prisma = require('../db/cliente');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecreto';
const REDIRECT_AFTER_LOGIN = '/reto3/seguridad/umg2025/protegido/protegido.html';

const cca = new msal.ConfidentialClientApplication({
    auth:{
        clientId: process.env.AZURE_CLIENT_ID,
        authority: process.env.AZURE_AUTHORITY,
        clientSecret: process.env.AZURE_CLIENT_SECRET
    }
});

const SCOPES = ['openid', 'profile', 'email', 'User.Read'];
const REDIRECT_URI = process.env.AZURE_REDIRECT_URL;

//inicio de sesion oauth con microsoft
async function loginAzure(req, res, next) {
    try {
        const url = await cca.getAuthCodeUrl({
            scopes: SCOPES,
            redirectUri: REDIRECT_URI,
            prompt: 'select_account'
        });
        res.redirect(url);
    } catch(error){
        next(error);
    }
}

//callback de microsoft
async function callback(req, res, next) {
    try{
        const tokenResponse = await cca.acquireTokenByCode({
            code: req.query.code,
            scopes: SCOPES,
            redirectUri: REDIRECT_URI
        });

        const acc = tokenResponse.account;
        const email = acc.username;
        const name = acc.name || email;
        const microsoftID = acc.homeAccountId;

        //buscar usuario en DB
        let usuarioexiste = await prisma.usuario.findUnique({
            where:{
                correo: email
            }
        });

        if(!usuarioexiste){
            //si el usuario no existe crear uno nuevo con el proveedor azure
            usuarioexiste = await prisma.usuario.create({
                data:{
                    correo: email,
                    nombre: name,
                    proveedor: 'azure',
                    microsoftID: microsoftID
                }
            });
        } else {
            //actualizar los datos si se cambiaron
            if (
                usuarioexiste.proveedor !== 'azure' ||
                usuarioexiste.microsoftID !== microsoftID ||
                usuarioexiste.nombre !== name
            ){
                usuarioexiste = await prisma.usuario.update({
                    where: {
                        id: usuarioexiste.id
                    },
                    data: {
                        proveedor: 'azure',
                        microsoftID,
                        nombre: name
                    }
                });
            }
        }

        //jwt con id, correo y nombre

        const jwtToken = jwt.sign(
            {
                id: usuarioexiste.id,
                correo: usuarioexiste.correo,
                name: usuarioexiste.nombre 
            },
            JWT_SECRET,
            {
                expiresIn: '1d'
            }
        );

        // redireccion del token en hash
        const url = `${REDIRECT_AFTER_LOGIN}#token=${encodeURIComponent(jwtToken)}`;
        return res.redirect(url);
    } catch(error){
        next(error);
    }
}

/*cerrar sesion
function logout(req, res) {
  res.redirect('/reto3/seguridad/umg2025');
}*/
/*
function logout(req, res){
    //volver a cargar usuario
    const tenant = process.env.AZURE_TENANT_ID;

    //pagina donde se regresara despues del logout
    const logouturl = encodeURIComponent('http://localhost:3000/reto3/seguridad/umg2025/logout-done');

    const msLogoutUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/logout?post_logout_redirect_uri=${logouturl}`;
    res.redirect(msLogoutUrl);
}
*/

function logout(req, res){
    //volver a cargar usuario
    const tenant = process.env.AZURE_TENANT_ID;

    //pagina donde se regresara despues del logout
    const logouturl = encodeURIComponent(`https://${process.env.PUBLIC_BASE_URL}/reto3/seguridad/umg2025/logout-done`);

    const msLogoutUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/logout?post_logout_redirect_uri=${logouturl}`;
    res.redirect(msLogoutUrl);
}

module.exports = {
    loginAzure,
    callback,
    logout
};