const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const configuracionController = require('../controllers/configuracion.controller');
const estadisticasController = require('../controllers/estadisticas.controller');
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
router.put('/pedidos/:id/notas', adminController.actualizarNotasPedido);
router.put('/pedidos/:id/presupuesto', adminController.actualizarPresupuestoPedido);
router.delete('/pedidos/:id', adminController.eliminarPedido);

// CONFIGURACION
router.put('/configuracion', configuracionController.actualizarConfiguracion);

// ESTADISTICAS DEL DASHBOARD
router.get('/estadisticas', estadisticasController.obtenerEstadisticas);

module.exports = router;