import express from 'express';
import * as usuariosController from '../controllers/usuarios.controller.js';
import * as carritoController from '../controllers/carrito.controller.js';
import { requiereAuthUsuario } from '../middlewares/auth.middleware.js';
import { limitadorAuth, limitadorEmails } from '../middlewares/rateLimit.middleware.js';

const router = express.Router();

// REGISTRO EN DOS PASOS
router.post('/registro', limitadorEmails, usuariosController.iniciarRegistro);
router.post('/verificar-codigo', usuariosController.verificarCodigo);
router.post('/reenviar-codigo', limitadorEmails, usuariosController.reenviarCodigo);

// RECUPERACIÓN DE CONTRASEÑA
router.post('/recuperar-password', limitadorEmails, usuariosController.recuperarPassword);
router.post('/restablecer-password', limitadorAuth, usuariosController.restablecerPassword);

// LOGIN
router.post('/login', usuariosController.iniciarSesion);

// PERFIL
router.get('/perfil', requiereAuthUsuario, usuariosController.obtenerPerfil);
router.put('/perfil/password', requiereAuthUsuario, usuariosController.cambiarPassword);
router.put('/perfil/email', requiereAuthUsuario, usuariosController.cambiarEmail);
router.delete('/perfil', requiereAuthUsuario, usuariosController.darDeBajaUsuario);

// HISTORIAL DE PEDIDOS
router.get('/pedidos', requiereAuthUsuario, usuariosController.listarMisPedidos);
router.get('/pedidos/:id', requiereAuthUsuario, usuariosController.obtenerDetallePedido);
router.put('/pedidos/:id/cancelar', requiereAuthUsuario, usuariosController.cancelarPedido);
router.post('/pedidos/:id/repetir', requiereAuthUsuario, usuariosController.repetirPedido);

// CARRITO
router.post('/carrito/agregar', requiereAuthUsuario, carritoController.agregarAlCarrito);
router.get('/carrito', requiereAuthUsuario, carritoController.listarCarrito);
router.put('/carrito/:id', requiereAuthUsuario, carritoController.cambiarCantidad);
router.delete('/carrito/:id', requiereAuthUsuario, carritoController.eliminarItem);
router.delete('/carrito', requiereAuthUsuario, carritoController.vaciarCarrito);
router.post('/carrito/enviar-pedido', requiereAuthUsuario, carritoController.enviarPedido);

export const usuariosRoutes = router;
