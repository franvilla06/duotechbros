const pedidosModel = require('../models/pedidos.model');
const productosModel = require('../models/productos.model');
const portafolioModel = require('../models/portafolio.model');
const usuariosModel = require('../models/usuarios.model');
const authService = require('../services/auth.service');

// crear un pedido de reparacion
// requiere usuario autenticado
// los datos del formulario pueden ser de otra persona (el usuario pide para alguien mas)
// igualmente se guarda el usuario_id del que envio la solicitud
function crearPedido(req, res) {
    const { nombre_cliente, telefono, email, modelo_celular, descripcion_problema } = req.body;
    if (!nombre_cliente || !email || !modelo_celular || !descripcion_problema) {
        return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
    }

    try {
        const db = req.app.locals.db;

        // obtener el id del usuario autenticado
        const usuarioId = usuariosModel.obtenerId(db, req.usuario);
        if (!usuarioId) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
        }

        const info = pedidosModel.crear(db, {
            nombre_cliente,
            telefono,
            email,
            modelo_celular,
            descripcion_problema,
            usuario_id: usuarioId,
            tipo: 'reparacion',
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