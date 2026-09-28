const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const { requiereAuth } = require('../middlewares/auth.middleware');

// todas las rutas de este router están protegidas por el middleware
router.use(requiereAuth);

// PRODUCTOS
router.post('/productos', adminController.crearProducto);
router.put('/productos/:id', adminController.actualizarProducto);
router.delete('/productos/:id', adminController.eliminarProducto);

// PORTAFOLIO
router.post('/portafolio', adminController.crearTrabajo);
router.put('/portafolio/:id', adminController.actualizarTrabajo);
router.delete('/portafolio/:id', adminController.eliminarTrabajo);

// PEDIDOS
router.put('/pedidos/:id', adminController.actualizarEstadoPedido);
router.delete('/pedidos/:id', adminController.eliminarPedido);

module.exports = router;