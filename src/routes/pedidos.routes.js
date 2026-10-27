import express from 'express';
import * as pedidosController from '../controllers/pedidos.controller.js';
import * as configuracionController from '../controllers/configuracion.controller.js';
import { requiereAuth, requiereAuthUsuario } from '../middlewares/auth.middleware.js';

const router = express.Router();

// crea una solicitud de reparación para el usuario autenticado
router.post('/pedidos', requiereAuthUsuario, pedidosController.crearPedido);

// exige autenticación de administrador para consultar la lista de pedidos
router.get('/pedidos', requiereAuth, pedidosController.listarPedidos);
router.get('/productos', pedidosController.listarProductos);
router.get('/portafolio', pedidosController.listarPortafolio);
router.post('/login', pedidosController.iniciarSesion);

// publica la configuración visible en el sitio
router.get('/configuracion', configuracionController.obtenerConfiguracionPublica);

// limita el detalle de cada pedido al administrador autenticado
router.get('/pedidos/:id/detalle', requiereAuth, pedidosController.obtenerDetallePedidoAdmin);

export const pedidosRoutes = router;
