const express = require('express');
const controller = require('../controllers/pedidos.controller');
const configuracionController = require('../controllers/configuracion.controller');
const { requiereAuth, requiereAuthUsuario } = require('../middlewares/auth.middleware');

const router = express.Router();

// crear un pedido de reparacion requiere usuario autenticado
router.post('/pedidos', requiereAuthUsuario, controller.crearPedido);

// las lecturas son publicas
router.get('/pedidos', controller.listarPedidos);
router.get('/productos', controller.listarProductos);
router.get('/portafolio', controller.listarPortafolio);
router.post('/login', controller.iniciarSesion);

// configuracion publica del sitio (para el footer, contacto, etc.)
router.get('/configuracion', configuracionController.obtenerConfiguracion);

// detalle de un pedido (solo admin)
router.get('/pedidos/:id/detalle', requiereAuth, controller.obtenerDetallePedidoAdmin);

module.exports = router;