async function crear(pool, pedido) {
    const [result] = await pool.query(
        `INSERT INTO pedidos (nombre_cliente, telefono, email, modelo_celular, descripcion_problema, usuario_id, tipo)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            pedido.nombre_cliente,
            pedido.telefono,
            pedido.email,
            pedido.modelo_celular,
            pedido.descripcion_problema,
            pedido.usuario_id || null,
            pedido.tipo || 'reparacion',
        ]
    );
    return { insertId: result.insertId };
}

async function listar(pool, tipo = null) {
    if (tipo) {
        const [rows] = await pool.query(
            'SELECT * FROM pedidos WHERE tipo = ? ORDER BY creado_en DESC',
            [tipo]
        );
        return rows;
    }
    const [rows] = await pool.query('SELECT * FROM pedidos ORDER BY creado_en DESC');
    return rows;
}

async function actualizarEstado(pool, id, estado) {
    const [result] = await pool.query('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, id]);
    return { affectedRows: result.affectedRows };
}

async function actualizarNotas(pool, id, notas) {
    const [result] = await pool.query('UPDATE pedidos SET notas = ? WHERE id = ?', [notas, id]);
    return { affectedRows: result.affectedRows };
}

async function actualizarPresupuesto(pool, id, presupuesto) {
    const [result] = await pool.query(
        'UPDATE pedidos SET presupuesto = ? WHERE id = ?',
        [presupuesto, id]
    );
    return { affectedRows: result.affectedRows };
}

async function eliminar(pool, id) {
    const [result] = await pool.query('DELETE FROM pedidos WHERE id = ?', [id]);
    return { affectedRows: result.affectedRows };
}

async function crearPedidoDeUsuario(pool, pedido) {
    const [result] = await pool.query(
        `INSERT INTO pedidos (
            nombre_cliente, telefono, email, modelo_celular, descripcion_problema,
            estado, usuario_id, tipo, notas
         )
         VALUES (?, ?, ?, ?, ?, 'pendiente', ?, 'producto', ?)`,
        [
            pedido.nombre_cliente,
            pedido.telefono,
            pedido.email,
            pedido.modelo_celular,
            pedido.descripcion_problema,
            pedido.usuario_id,
            pedido.notas,
        ]
    );
    return { insertId: result.insertId };
}

async function insertarItem(pool, item) {
    await pool.query(
        `INSERT INTO pedido_items (pedido_id, producto_id, nombre_producto, precio_unitario, cantidad, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
            item.pedido_id,
            item.producto_id,
            item.nombre_producto,
            item.precio_unitario,
            item.cantidad,
            item.subtotal,
        ]
    );
}

// HISTORIAL DEL USUARIO

async function listarPorUsuario(pool, usuarioId) {
    const [rows] = await pool.query(
        `SELECT
            p.id, p.estado, p.creado_en, p.notas, p.tipo,
            p.modelo_celular, p.descripcion_problema, p.presupuesto,
            COUNT(pi.id) AS total_items,
            COALESCE(SUM(pi.cantidad), 0) AS total_unidades,
            COALESCE(SUM(pi.subtotal), 0) AS total_precio
         FROM pedidos p
         LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
         WHERE p.usuario_id = ?
         GROUP BY p.id
         ORDER BY p.creado_en DESC`,
        [usuarioId]
    );
    return rows;
}

async function obtenerPedidoDeUsuario(pool, pedidoId, usuarioId) {
    const [rows] = await pool.query(
        `SELECT id, estado, creado_en, notas, tipo, modelo_celular,
                descripcion_problema, presupuesto, nombre_cliente, telefono, email
         FROM pedidos
         WHERE id = ? AND usuario_id = ?`,
        [pedidoId, usuarioId]
    );
    return rows[0] || null;
}

async function listarItemsDePedido(pool, pedidoId) {
    const [rows] = await pool.query(
        `SELECT id, producto_id, nombre_producto, precio_unitario, cantidad, subtotal
         FROM pedido_items
         WHERE pedido_id = ?
         ORDER BY id ASC`,
        [pedidoId]
    );
    return rows;
}

// DETALLE COMPLETO PARA EL ADMIN

async function obtenerPedidoConItems(pool, pedidoId) {
    const [rows] = await pool.query(
        `SELECT
            p.id, p.nombre_cliente, p.telefono, p.email, p.modelo_celular,
            p.descripcion_problema, p.estado, p.creado_en, p.notas,
            p.presupuesto, p.usuario_id, p.tipo,
            u.usuario AS usuario_nombre
         FROM pedidos p
         LEFT JOIN usuarios u ON u.id = p.usuario_id
         WHERE p.id = ?`,
        [pedidoId]
    );

    const pedido = rows[0];
    if (!pedido) return null;

    const items = await listarItemsDePedido(pool, pedidoId);

    const totalPrecio = items.reduce((acc, item) => acc + Number(item.subtotal), 0);
    const totalUnidades = items.reduce((acc, item) => acc + item.cantidad, 0);

    return {
        ...pedido,
        items,
        total_items: items.length,
        total_unidades: totalUnidades,
        total_precio: Number(totalPrecio.toFixed(2)),
    };
}

// CANCELAR UN PEDIDO DEL USUARIO (con transaccion)

async function cancelarPedidoDeUsuario(pool, pedidoId, usuarioId) {
    const [rows] = await pool.query(
        'SELECT id, tipo, estado FROM pedidos WHERE id = ? AND usuario_id = ?',
        [pedidoId, usuarioId]
    );

    const pedido = rows[0];
    if (!pedido) return { error: 'Pedido no encontrado.' };

    const estadoActual = (pedido.estado || 'pendiente').toLowerCase().trim();
    if (estadoActual !== 'pendiente') {
        return { error: 'Solo se pueden cancelar pedidos en estado pendiente.' };
    }

    const conexion = await pool.getConnection();
    try {
        await conexion.beginTransaction();

        // si es compra, restaurar stock
        if (pedido.tipo === 'producto') {
            const [items] = await conexion.query(
                'SELECT producto_id, cantidad FROM pedido_items WHERE pedido_id = ?',
                [pedidoId]
            );

            for (const item of items) {
                if (item.producto_id) {
                    await conexion.query(
                        'UPDATE productos SET stock = stock + ? WHERE id = ?',
                        [item.cantidad, item.producto_id]
                    );
                }
            }
        }

        // cambiar estado
        await conexion.query("UPDATE pedidos SET estado = 'cancelado' WHERE id = ?", [pedidoId]);

        await conexion.commit();
        return { success: true };
    } catch (error) {
        await conexion.rollback();
        throw error;
    } finally {
        conexion.release();
    }
}

module.exports = {
    crear,
    listar,
    actualizarEstado,
    actualizarNotas,
    actualizarPresupuesto,
    eliminar,
    crearPedidoDeUsuario,
    insertarItem,
    listarPorUsuario,
    obtenerPedidoDeUsuario,
    listarItemsDePedido,
    obtenerPedidoConItems,
    cancelarPedidoDeUsuario,
};