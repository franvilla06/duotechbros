// GESTIÓN DE PRODUCTOS

function crearProducto(req, res) {
    const { nombre, descripcion, precio, imagen_url, categoria, stock } = req.body;

    if (!nombre || precio === undefined) {
        return res.status(400).json({ success: false, error: 'Faltan campos obligatorios (nombre, precio)' });
    }

    try {
        const insert = req.app.locals.db.prepare(`
            INSERT INTO productos (nombre, descripcion, precio, imagen_url, categoria, stock)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        const info = insert.run(
            nombre,
            descripcion || null,
            precio,
            imagen_url || null,
            categoria || null,
            stock || 0
        );
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
        const info = req.app.locals.db.prepare(`
            UPDATE productos
            SET nombre = ?, descripcion = ?, precio = ?, imagen_url = ?, categoria = ?, stock = ?
            WHERE id = ?
        `).run(
            nombre,
            descripcion || null,
            precio,
            imagen_url || null,
            categoria || null,
            stock || 0,
            id
        );

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
        const info = req.app.locals.db.prepare('DELETE FROM productos WHERE id = ?').run(id);
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
        const insert = req.app.locals.db.prepare(`
            INSERT INTO portafolio (titulo, descripcion, imagen_url, tipo_reparacion)
            VALUES (?, ?, ?, ?)
        `);
        const info = insert.run(
            titulo,
            descripcion || null,
            imagen_url || null,
            tipo_reparacion || null
        );
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
        const info = req.app.locals.db.prepare(`
            UPDATE portafolio
            SET titulo = ?, descripcion = ?, imagen_url = ?, tipo_reparacion = ?
            WHERE id = ?
        `).run(
            titulo,
            descripcion || null,
            imagen_url || null,
            tipo_reparacion || null,
            id
        );

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
        const info = req.app.locals.db.prepare('DELETE FROM portafolio WHERE id = ?').run(id);
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
        const info = req.app.locals.db
            .prepare('UPDATE pedidos SET estado = ? WHERE id = ?')
            .run(estado, id);

        if (info.changes === 0) {
            return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
        }

        return res.json({ success: true, message: 'Estado actualizado', estado });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

function eliminarPedido(req, res) {
    const { id } = req.params;
    try {
        const info = req.app.locals.db.prepare('DELETE FROM pedidos WHERE id = ?').run(id);
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
    eliminarPedido,
};