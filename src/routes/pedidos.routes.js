const express = require('express');
const controller = require('../controllers/pedidos.controller');
const { requiereAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/pedidos', controller.crearPedido);
router.get('/pedidos', controller.listarPedidos);
router.get('/productos', controller.listarProductos);
router.get('/portafolio', controller.listarPortafolio);
router.post('/login', controller.iniciarSesion);

// detalle de un pedido (protegido: solo admin)
router.get('/pedidos/:id/detalle', requiereAuth, controller.obtenerDetallePedidoAdmin);

module.exports = router;