// controllers/2fa.js
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const prisma = require('../db/cliente');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecreto';

// POST /2fa/enroll  (requiere JWT)
async function iniciarEnrolamiento2FA(req, res, next) {
  try {
    const usuarioId = req.user.id;
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado... ' });

    const secret = speakeasy.generateSecret({
      name: `Reto3 (${usuario.correo})`,
      length: 20
    });

    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { secreto2FA: secret.base32 }
    });

    const otpauth = secret.otpauth_url;
    const qrDataUrl = await QRCode.toDataURL(otpauth);

    res.json({ qrDataUrl, manualKey: secret.base32 });
  } catch (error) {
    next(error);
  }
}

// POST /2fa/confirm  (requiere JWT)  body: { code }
async function confirmacion2FA(req, res, next) {
  try {
    const usuarioId = req.user.id;
    const { code } = req.body;

    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario?.secreto2FA) {
      return res.status(400).json({ mensaje: 'No se ha iniciado enrolamiento 2FA' });
    }

    const ok = speakeasy.totp.verify({
      secret: usuario.secreto2FA,
      encoding: 'base32',
      token: code,
      window: 1
    });

    if (!ok) return res.status(400).json({ mensaje: 'Codigo invalido...' });

    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { tiene2FA: true }
    });

    res.json({ mensaje: '2FA activado' });
  } catch (error) {
    next(error);
  }
}

// POST /login/local/2fa   body: { userId, code }
async function verificar2FAyEmitirJWT(req, res, next) {
  try {
    const { userId, code } = req.body; // ← nombre correcto (coincide con el front)
    const usuario = await prisma.usuario.findUnique({ where: { id: Number(userId) } });
    if (!usuario?.tiene2FA || !usuario?.secreto2FA) {
      return res.status(400).json({ mensaje: '2FA no habilitado para este usuario... ' });
    }

    const ok = speakeasy.totp.verify({
      secret: usuario.secreto2FA, // ← este es el secreto correcto
      encoding: 'base32',
      token: code,
      window: 1
    });

    if (!ok) return res.status(401).json({ mensaje: 'Codigo 2FA invalido' });

    const token = jwt.sign(
      { id: usuario.id, correo: usuario.correo, name: usuario.nombre, prov: 'local' },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ mensaje: 'Login con 2FA exitoso... ', token });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  iniciarEnrolamiento2FA,
  confirmacion2FA,
  verificar2FAyEmitirJWT
};
