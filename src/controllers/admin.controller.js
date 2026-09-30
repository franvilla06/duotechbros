// GESTIÓN DE PRODUCTOS

const productosModel = require('../models/productos.model');
const portafolioModel = require('../models/portafolio.model');
const pedidosModel = require('../models/pedidos.model');

function crearProducto(req, res) {
    const { nombre, descripcion, precio, imagen_url, categoria, stock } = req.body;

    if (!nombre || precio === undefined) {
        return res.status(400).json({ success: false, error: 'Faltan campos obligatorios (nombre, precio)' });
    }

    try {
        const info = productosModel.crear(req.app.locals.db, {
            nombre,
            descripcion: descripcion || null,
            precio,
            imagen_url: imagen_url || null,
            categoria: categoria || null,
            stock: stock || 0,
        });
        return res.json({ success: true, id: info.lastInsertRowid });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

function actualizarProducto(req, res) {
    const { id } = req.params;
    const { nombre, descripcion, precio, imagen_url, categoria, stock } = req.body;

    if (!nombre || precio === undefined) {
        return res.status(400).json({ success: false, error: 'Faltan campos obligatorios (nombre, precio)' });
    }

    try {
        const info = productosModel.actualizar(req.app.locals.db, id, {
            nombre,
            descripcion: descripcion || null,
            precio,
            imagen_url: imagen_url || null,
            categoria: categoria || null,
            stock: stock || 0,
        });

        if (info.changes === 0) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado' });
        }

        return res.json({ success: true, message: 'Producto actualizado' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

function eliminarProducto(req, res) {
    const { id } = req.params;
    try {
        const info = productosModel.eliminar(req.app.locals.db, id);
        if (info.changes === 0) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado' });
        }
        return res.json({ success: true, message: 'Producto eliminado' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

// GESTIÓN DE PORTAFOLIO

function crearTrabajo(req, res) {
    const { titulo, descripcion, imagen_url, tipo_reparacion } = req.body;

    if (!titulo) {
        return res.status(400).json({ success: false, error: 'El título es obligatorio' });
    }

    try {
        const info = portafolioModel.crear(req.app.locals.db, {
            titulo,
            descripcion: descripcion || null,
            imagen_url: imagen_url || null,
            tipo_reparacion: tipo_reparacion || null,
        });
        return res.json({ success: true, id: info.lastInsertRowid });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

function actualizarTrabajo(req, res) {
    const { id } = req.params;
    const { titulo, descripcion, imagen_url, tipo_reparacion } = req.body;

    if (!titulo) {
        return res.status(400).json({ success: false, error: 'El título es obligatorio' });
    }

    try {
        const info = portafolioModel.actualizar(req.app.locals.db, id, {
            titulo,
            descripcion: descripcion || null,
            imagen_url: imagen_url || null,
            tipo_reparacion: tipo_reparacion || null,
        });

        if (info.changes === 0) {
            return res.status(404).json({ success: false, error: 'Trabajo no encontrado' });
        }

        return res.json({ success: true, message: 'Trabajo actualizado' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

function eliminarTrabajo(req, res) {
    const { id } = req.params;
    try {
        const info = portafolioModel.eliminar(req.app.locals.db, id);
        if (info.changes === 0) {
            return res.status(404).json({ success: false, error: 'Trabajo no encontrado' });
        }
        return res.json({ success: true, message: 'Trabajo eliminado' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

// GESTIÓN DE PEDIDOS

const ESTADOS_VALIDOS = ['pendiente', 'en proceso', 'completado', 'cancelado'];

function actualizarEstadoPedido(req, res) {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
        return res.status(400).json({
            success: false,
            error: `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}`,
        });
    }

    try {
        const info = pedidosModel.actualizarEstado(req.app.locals.db, id, estado);

        if (info.changes === 0) {
            return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
        }

        return res.json({ success: true, message: 'Estado actualizado', estado });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

function actualizarNotasPedido(req, res) {
    const { id } = req.params;
    const { notas } = req.body;

    // normalizar: string vacío o solo espacios → null (borrar la nota)
    let notasValor = null;
    if (notas !== undefined && notas !== null) {
        const texto = String(notas).trim();
        notasValor = texto === '' ? null : texto;
    }

    try {
        const info = pedidosModel.actualizarNotas(req.app.locals.db, id, notasValor);

        if (info.changes === 0) {
            return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
        }

        return res.json({ success: true, message: 'Notas actualizadas', notas: notasValor });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

function eliminarPedido(req, res) {
    const { id } = req.params;
    try {
        const info = pedidosModel.eliminar(req.app.locals.db, id);
        if (info.changes === 0) {
            return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
        }
        return res.json({ success: true, message: 'Pedido eliminado' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    crearTrabajo,
    actualizarTrabajo,
    eliminarTrabajo,
    actualizarEstadoPedido,
    actualizarNotasPedido,
    eliminarPedido,
};