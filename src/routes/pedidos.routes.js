const express = require('express');
const controller = require('../controllers/pedidos.controller');

const router = express.Router();

router.post('/pedidos', controller.crearPedido);
router.get('/pedidos', controller.listarPedidos);
router.get('/productos', controller.listarProductos);
router.get('/portafolio', controller.listarPortafolio);
router.post('/login', controller.iniciarSesion);

module.exports = router;