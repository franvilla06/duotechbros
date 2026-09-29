const express = require('express');
const router = express.Router();

const usuariosController = require('../controllers/usuarios.controller');
const { requiereAuthUsuario } = require('../middlewares/auth.middleware');

// rutas publicas
router.post('/registro', usuariosController.registrar);
router.post('/login', usuariosController.iniciarSesion);

// rutas protegidas (requieren token de usuario)
router.get('/perfil', requiereAuthUsuario, usuariosController.obtenerPerfil);

module.exports = router;