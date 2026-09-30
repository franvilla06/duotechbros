const pedidosModel = require('../models/pedidos.model');
const productosModel = require('../models/productos.model');
const portafolioModel = require('../models/portafolio.model');
const authService = require('../services/auth.service');

function crearPedido(req, res) {
    const { nombre_cliente, telefono, email, modelo_celular, descripcion_problema } = req.body;
    if (!nombre_cliente || !email || !modelo_celular || !descripcion_problema) {
        return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
    }

    try {
        const info = pedidosModel.crear(req.app.locals.db, {
            nombre_cliente,
            telefono,
            email,
            modelo_celular,
            descripcion_problema,
        });
        return res.json({ success: true, id: info.lastInsertRowid });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

// listar pedidos, con filtro opcional por tipo
// ?tipo=reparacion o ?tipo=producto
function listarPedidos(req, res) {
    try {
        const tipo = req.query.tipo || null;
        const pedidos = pedidosModel.listar(req.app.locals.db, tipo);
        return res.json(pedidos);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

function listarProductos(req, res) {
    try {
        return res.json(productosModel.listar(req.app.locals.db));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

function listarPortafolio(req, res) {
    try {
        return res.json(portafolioModel.listar(req.app.locals.db));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

function iniciarSesion(req, res) {
    const { usuario, password } = req.body;
    try {
        const admin = authService.autenticarAdministrador(req.app.locals.db, usuario, password);
        if (!admin) {
            return res.status(401).json({ success: false, error: 'Usuario o contrasenia incorrectos' });
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

// DETALLE DE UNA COMPRA PARA EL ADMIN

function obtenerDetallePedidoAdmin(req, res) {
    const { id } = req.params;
    try {
        const pedido = pedidosModel.obtenerPedidoConItems(req.app.locals.db, id);
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