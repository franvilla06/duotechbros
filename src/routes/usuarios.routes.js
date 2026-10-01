const express = require('express');
const router = express.Router();

const usuariosController = require('../controllers/usuarios.controller');
const carritoController = require('../controllers/carrito.controller');
const { requiereAuthUsuario } = require('../middlewares/auth.middleware');

// rutas publicas
router.post('/registro', usuariosController.registrar);
router.post('/login', usuariosController.iniciarSesion);

// rutas protegidas (requieren token de usuario)
router.get('/perfil', requiereAuthUsuario, usuariosController.obtenerPerfil);
router.put('/perfil/password', requiereAuthUsuario, usuariosController.cambiarPassword);
router.delete('/perfil', requiereAuthUsuario, usuariosController.darDeBajaUsuario);

// historial de pedidos
router.get('/pedidos', requiereAuthUsuario, usuariosController.listarMisPedidos);
router.get('/pedidos/:id', requiereAuthUsuario, usuariosController.obtenerDetallePedido);
router.put('/pedidos/:id/cancelar', requiereAuthUsuario, usuariosController.cancelarPedido);
router.post('/pedidos/:id/repetir', requiereAuthUsuario, usuariosController.repetirPedido);

// rutas del carrito
router.post('/carrito/agregar', requiereAuthUsuario, carritoController.agregarAlCarrito);
router.get('/carrito', requiereAuthUsuario, carritoController.listarCarrito);
router.put('/carrito/:id', requiereAuthUsuario, carritoController.cambiarCantidad);
router.delete('/carrito/:id', requiereAuthUsuario, carritoController.eliminarItem);
router.delete('/carrito', requiereAuthUsuario, carritoController.vaciarCarrito);
router.post('/carrito/enviar-pedido', requiereAuthUsuario, carritoController.enviarPedido);

module.exports = router;