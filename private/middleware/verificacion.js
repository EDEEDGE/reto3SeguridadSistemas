// middleware/verificacion.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecreto';

module.exports = function verificarJWT(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) return res.status(401).json({ mensaje: 'Token requerido' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET); // { id, correo, name }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ mensaje: 'Token invalido o expirado...' });
  }
};
