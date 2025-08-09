const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db/cliente');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecreto';

async function crearUsuario(req, res, next) {
    try {
        const {nombre, correo, contraseña} = req.body;

        //verificacion de usuario ya existente
        const existeUsuario = await prisma.usuario.findUnique({where: {correo}});
        if(existeUsuario) {
            return res.status(400).json({mensaje: 'Correo ya registrado... '});
        }

        //hasheo de contraseña
        const hashContraseña = await bcrypt.hash(contraseña, 10);

        //creacion del usuario
        const nuevoUsuario = await prisma.usuario.create({
            data: {
                nombre,
                correo,
                claveHash: hashContraseña,
                proveedor: 'local'
            },
        });

        //confirmacion
        res.status(201).json({
            mensaje: 'Usuario creado correctamente... ',
            usuario: {
                id: nuevoUsuario.id,
                correo: nuevoUsuario.correo
            }
        });
    } catch(error) {
        next(error);
    }
}

async function login(req, res, next) {
  try {
    const { correo, contraseña } = req.body;

    const encontrarCorreo = await prisma.usuario.findUnique({
      where: { correo }
    });

    // Usuario no existe o es solo-OAuth (sin claveHash)
    if (!encontrarCorreo || !encontrarCorreo.claveHash) {
      return res.status(401).json({
        mensaje: 'Credenciales incorrectas, intente unas diferentes...'
      });
    }

    // Verificar contraseña
    const isMatch = await bcrypt.compare(contraseña, encontrarCorreo.claveHash);
    if (!isMatch) {
      return res.status(401).json({
        mensaje: 'Credenciales incorrectas... pruebe unas diferentes...'
      });
    }

    // Si el usuario tiene 2FA habilitado -> NO emitir JWT todavía
    if (encontrarCorreo.tiene2FA) {
      return res.json({
        requiere2FA: true,
        userId: encontrarCorreo.id,
        mensaje: 'Se requiere código 2FA para completar el login.'
      });
    }

    // Si NO tiene 2FA -> emitir JWT como siempre (ahora con name para tu UI)
    const token = jwt.sign(
      { id: encontrarCorreo.id, correo: encontrarCorreo.correo, name: encontrarCorreo.nombre, prov: 'local' },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({ mensaje: 'Login exitoso...', token });
  } catch (error) {
    next(error);
  }
}

//exportar modulos
module.exports = {
    crearUsuario,
    login
}