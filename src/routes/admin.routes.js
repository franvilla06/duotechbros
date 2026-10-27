// Rutas protegidas para el panel de administración. El * sirve para indicar que todas las rutas de este router requieren autenticación.
import express from 'express';
import * as adminController from '../controllers/admin.controller.js';
import * as configuracionController from '../controllers/configuracion.controller.js';
import * as estadisticasController from '../controllers/estadisticas.controller.js';
import { requiereAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

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

// PERFIL DEL ADMIN
router.get('/perfil', adminController.obtenerPerfilAdmin);
router.put('/perfil/usuario', adminController.cambiarUsuarioAdmin);
router.put('/perfil/password', adminController.cambiarPasswordAdmin);

export const adminRoutes = router;
