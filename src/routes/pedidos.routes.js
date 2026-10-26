import express from 'express';
import * as pedidosController from '../controllers/pedidos.controller.js';
import * as configuracionController from '../controllers/configuracion.controller.js';
import { requiereAuth, requiereAuthUsuario } from '../middlewares/auth.middleware.js';

const router = express.Router();

// crear un pedido de reparacion requiere usuario autenticado
router.post('/pedidos', requiereAuthUsuario, pedidosController.crearPedido);

// las lecturas de pedidos requieren autenticacion de administrador
router.get('/pedidos', requiereAuth, pedidosController.listarPedidos);
router.get('/productos', pedidosController.listarProductos);
router.get('/portafolio', pedidosController.listarPortafolio);
router.post('/login', pedidosController.iniciarSesion);

// configuracion publica del sitio (para el footer, contacto, etc.)
router.get('/configuracion', configuracionController.obtenerConfiguracionPublica);

// detalle de un pedido (solo admin)
router.get('/pedidos/:id/detalle', requiereAuth, pedidosController.obtenerDetallePedidoAdmin);

export const pedidosRoutes = router;
