const pedidosModel = require('../models/pedidos.model');
const productosModel = require('../models/productos.model');
const portafolioModel = require('../models/portafolio.model');
const usuariosModel = require('../models/usuarios.model');
const configuracionModel = require('../models/configuracion.model');
const authService = require('../services/auth.service');
const emailService = require('../services/email.service');

// crear un pedido de reparacion (requiere usuario autenticado)
async function crearPedido(req, res) {
    const { nombre_cliente, telefono, email, modelo_celular, descripcion_problema } = req.body;
    if (!nombre_cliente || !email || !modelo_celular || !descripcion_problema) {
        return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
    }

    try {
        const pool = req.app.locals.pool;

        const usuarioId = await usuariosModel.obtenerId(pool, req.usuario);
        if (!usuarioId) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
        }

        const info = await pedidosModel.crear(pool, {
            nombre_cliente,
            telefono,
            email,
            modelo_celular,
            descripcion_problema,
            usuario_id: usuarioId,
            tipo: 'reparacion',
        });

        // Enviar la confirmacion sin retrasar la respuesta del pedido.
        enviarConfirmacionReparacionPorEmail(pool, req.usuario, info.insertId, {
            nombre_cliente,
            telefono,
            email,
            modelo_celular,
            descripcion_problema,
        }).catch((error) => {
            console.error('Error al enviar confirmacion de reparacion:', error.message);
        });

        return res.json({ success: true, id: info.insertId });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function enviarConfirmacionReparacionPorEmail(pool, nombreUsuario, pedidoId, datos) {
    const destinatarios = new Set();
    if (datos.email && String(datos.email).trim() !== '') {
        destinatarios.add(String(datos.email).trim().toLowerCase());
    }

    const perfil = await usuariosModel.obtenerPerfil(pool, nombreUsuario);
    if (perfil && perfil.email && String(perfil.email).trim() !== '') {
        destinatarios.add(String(perfil.email).trim().toLowerCase());
    }

    const config = await configuracionModel.obtenerTodo(pool);
    const emailAdmin = (config.email_admin || '').trim();
    if (emailAdmin !== '') {
        destinatarios.add(emailAdmin.toLowerCase());
    }

    if (destinatarios.size === 0) {
        console.log('[email] confirmacion_reparacion: sin destinatarios validos.');
        return;
    }

    console.log(
        `[email] confirmacion_reparacion: enviando a ${Array.from(destinatarios).join(', ')}`
    );

    await emailService.enviarConfirmacionReparacion(Array.from(destinatarios), {
        id: pedidoId,
        nombre_cliente: datos.nombre_cliente,
        telefono: datos.telefono,
        email: datos.email,
        modelo_celular: datos.modelo_celular,
        descripcion_problema: datos.descripcion_problema,
        creado_en: new Date(),
    });
}

async function listarPedidos(req, res) {
    try {
        const tipo = req.query.tipo || null;
        const pedidos = await pedidosModel.listar(req.app.locals.pool, tipo);
        return res.json(pedidos);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function listarProductos(req, res) {
    try {
        return res.json(await productosModel.listar(req.app.locals.pool));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function listarPortafolio(req, res) {
    try {
        return res.json(await portafolioModel.listar(req.app.locals.pool));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function iniciarSesion(req, res) {
    const { usuario, password } = req.body;
    try {
        const admin = await authService.autenticarAdministrador(
            req.app.locals.pool,
            usuario,
            password
        );
        if (!admin) {
            return res
                .status(401)
                .json({ success: false, error: 'Usuario o contrasenia incorrectos' });
        }
        return res.json({
            success: true,
            message: 'Login exitoso',
            usuario: admin.usuario,
            token: admin.token,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function obtenerDetallePedidoAdmin(req, res) {
    const { id } = req.params;
    try {
        const pedido = await pedidosModel.obtenerPedidoConItems(req.app.locals.pool, id);
        if (!pedido) {
            return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
        }
        return res.json({ success: true, pedido });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    crearPedido,
    listarPedidos,
    listarProductos,
    listarPortafolio,
    iniciarSesion,
    obtenerDetallePedidoAdmin,
};