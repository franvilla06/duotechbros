const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const { requiereAuth } = require('../middlewares/auth.middleware');

// Todas las rutas de este router están protegidas por el middleware
router.use(requiereAuth);

// ----- Productos -----
router.post('/productos', adminController.crearProducto);
router.delete('/productos/:id', adminController.eliminarProducto);

// ----- Portafolio -----
router.post('/portafolio', adminController.crearTrabajo);
router.delete('/portafolio/:id', adminController.eliminarTrabajo);

// ----- Pedidos -----
router.put('/pedidos/:id', adminController.actualizarEstadoPedido);
router.delete('/pedidos/:id', adminController.eliminarPedido);

module.exports = router;