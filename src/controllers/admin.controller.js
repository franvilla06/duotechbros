// GESTION DE PRODUCTOS

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

// GESTION DE PORTAFOLIO

// normaliza una fecha a formato YYYY-MM-DD o null
// acepta string vacio, null o undefined como null
function normalizarFecha(valor) {
    if (valor === undefined || valor === null || valor === '') return null;
    const texto = String(valor).trim();
    if (texto === '') return null;
    // validar formato YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return null;
    return texto;
}

function crearTrabajo(req, res) {
    const { titulo, descripcion, imagen_url, tipo_reparacion, fecha_inicio, fecha_fin } = req.body;

    if (!titulo) {
        return res.status(400).json({ success: false, error: 'El título es obligatorio' });
    }

    try {
        const info = portafolioModel.crear(req.app.locals.db, {
            titulo,
            descripcion: descripcion || null,
            imagen_url: imagen_url || null,
            tipo_reparacion: tipo_reparacion || null,
            fecha_inicio: normalizarFecha(fecha_inicio),
            fecha_fin: normalizarFecha(fecha_fin),
        });
        return res.json({ success: true, id: info.lastInsertRowid });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

function actualizarTrabajo(req, res) {
    const { id } = req.params;
    const { titulo, descripcion, imagen_url, tipo_reparacion, fecha_inicio, fecha_fin } = req.body;

    if (!titulo) {
        return res.status(400).json({ success: false, error: 'El título es obligatorio' });
    }

    try {
        const info = portafolioModel.actualizar(req.app.locals.db, id, {
            titulo,
            descripcion: descripcion || null,
            imagen_url: imagen_url || null,
            tipo_reparacion: tipo_reparacion || null,
            fecha_inicio: normalizarFecha(fecha_inicio),
            fecha_fin: normalizarFecha(fecha_fin),
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

// GESTION DE PEDIDOS

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

function actualizarPresupuestoPedido(req, res) {
    const { id } = req.params;
    const { presupuesto } = req.body;

    let presupuestoValor = null;

    if (presupuesto !== undefined && presupuesto !== null && presupuesto !== '') {
        const num = Number(presupuesto);
        if (isNaN(num) || num < 0) {
            return res.status(400).json({
                success: false,
                error: 'El presupuesto debe ser un numero mayor o igual a 0.',
            });
        }
        presupuestoValor = Number(num.toFixed(2));
    }

    try {
        const info = pedidosModel.actualizarPresupuesto(req.app.locals.db, id, presupuestoValor);

        if (info.changes === 0) {
            return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
        }

        return res.json({
            success: true,
            message: 'Presupuesto actualizado',
            presupuesto: presupuestoValor,
        });
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
    actualizarPresupuestoPedido,
    eliminarPedido,
};