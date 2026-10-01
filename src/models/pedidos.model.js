// crea un pedido de reparacion o de producto
function crear(db, pedido) {
    return db
        .prepare(
            `
            INSERT INTO pedidos (
                nombre_cliente,
                telefono,
                email,
                modelo_celular,
                descripcion_problema,
                usuario_id,
                tipo
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `
        )
        .run(
            pedido.nombre_cliente,
            pedido.telefono,
            pedido.email,
            pedido.modelo_celular,
            pedido.descripcion_problema,
            pedido.usuario_id || null,
            pedido.tipo || 'reparacion'
        );
}

function listar(db, tipo = null) {
    if (tipo) {
        return db
            .prepare('SELECT * FROM pedidos WHERE tipo = ? ORDER BY creado_en DESC')
            .all(tipo);
    }
    return db.prepare('SELECT * FROM pedidos ORDER BY creado_en DESC').all();
}

function actualizarEstado(db, id, estado) {
    return db.prepare('UPDATE pedidos SET estado = ? WHERE id = ?').run(estado, id);
}

function actualizarNotas(db, id, notas) {
    return db.prepare('UPDATE pedidos SET notas = ? WHERE id = ?').run(notas, id);
}

function actualizarPresupuesto(db, id, presupuesto) {
    return db.prepare('UPDATE pedidos SET presupuesto = ? WHERE id = ?').run(presupuesto, id);
}

function eliminar(db, id) {
    return db.prepare('DELETE FROM pedidos WHERE id = ?').run(id);
}

function crearPedidoDeUsuario(db, pedido) {
    return db
        .prepare(
            `
            INSERT INTO pedidos (
                nombre_cliente,
                telefono,
                email,
                modelo_celular,
                descripcion_problema,
                estado,
                usuario_id,
                tipo,
                notas
            )
            VALUES (?, ?, ?, ?, ?, 'pendiente', ?, 'producto', ?)
        `
        )
        .run(
            pedido.nombre_cliente,
            pedido.telefono,
            pedido.email,
            pedido.modelo_celular,
            pedido.descripcion_problema,
            pedido.usuario_id,
            pedido.notas
        );
}

function insertarItem(db, item) {
    return db
        .prepare(
            `
            INSERT INTO pedido_items (
                pedido_id,
                producto_id,
                nombre_producto,
                precio_unitario,
                cantidad,
                subtotal
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `
        )
        .run(
            item.pedido_id,
            item.producto_id,
            item.nombre_producto,
            item.precio_unitario,
            item.cantidad,
            item.subtotal
        );
}

// HISTORIAL DEL USUARIO

function listarPorUsuario(db, usuarioId) {
    return db
        .prepare(
            `
            SELECT
                p.id,
                p.estado,
                p.creado_en,
                p.notas,
                p.tipo,
                p.modelo_celular,
                p.descripcion_problema,
                p.presupuesto,
                COUNT(pi.id) AS total_items,
                COALESCE(SUM(pi.cantidad), 0) AS total_unidades,
                COALESCE(SUM(pi.subtotal), 0) AS total_precio
            FROM pedidos p
            LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
            WHERE p.usuario_id = ?
            GROUP BY p.id
            ORDER BY p.creado_en DESC
        `
        )
        .all(usuarioId);
}

function obtenerPedidoDeUsuario(db, pedidoId, usuarioId) {
    return db
        .prepare(
            `
            SELECT
                id,
                estado,
                creado_en,
                notas,
                tipo,
                modelo_celular,
                descripcion_problema,
                presupuesto,
                nombre_cliente,
                telefono,
                email
            FROM pedidos
            WHERE id = ? AND usuario_id = ?
        `
        )
        .get(pedidoId, usuarioId);
}

function listarItemsDePedido(db, pedidoId) {
    return db
        .prepare(
            `
            SELECT
                id,
                producto_id,
                nombre_producto,
                precio_unitario,
                cantidad,
                subtotal
            FROM pedido_items
            WHERE pedido_id = ?
            ORDER BY id ASC
        `
        )
        .all(pedidoId);
}

// DETALLE COMPLETO DE UNA COMPRA PARA EL ADMIN

function obtenerPedidoConItems(db, pedidoId) {
    const pedido = db
        .prepare(
            `
            SELECT
                p.id,
                p.nombre_cliente,
                p.telefono,
                p.email,
                p.modelo_celular,
                p.descripcion_problema,
                p.estado,
                p.creado_en,
                p.notas,
                p.presupuesto,
                p.usuario_id,
                p.tipo,
                u.usuario AS usuario_nombre
            FROM pedidos p
            LEFT JOIN usuarios u ON u.id = p.usuario_id
            WHERE p.id = ?
        `
        )
        .get(pedidoId);

    if (!pedido) return null;

    const items = listarItemsDePedido(db, pedidoId);

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

// CANCELAR UN PEDIDO DEL USUARIO
// solo se puede cancelar si esta en estado pendiente
// si es una compra, se devuelve el stock de cada producto. todo se hace en una transaccion para no dejar datos inconsistentes

function cancelarPedidoDeUsuario(db, pedidoId, usuarioId) {
    const pedido = db
        .prepare('SELECT id, tipo, estado FROM pedidos WHERE id = ? AND usuario_id = ?')
        .get(pedidoId, usuarioId);

    if (!pedido) {
        return { error: 'Pedido no encontrado.' };
    }

    const estadoActual = (pedido.estado || 'pendiente').toLowerCase().trim();
    if (estadoActual !== 'pendiente') {
        return { error: 'Solo se pueden cancelar pedidos en estado pendiente.' };
    }

    const ejecutarCancelacion = db.transaction(() => {
        // si es una compra, restaurar el stock de cada producto
        if (pedido.tipo === 'producto') {
            const items = db
                .prepare('SELECT producto_id, cantidad FROM pedido_items WHERE pedido_id = ?')
                .all(pedidoId);

            const updateStock = db.prepare('UPDATE productos SET stock = stock + ? WHERE id = ?');
            for (const item of items) {
                if (item.producto_id) {
                    updateStock.run(item.cantidad, item.producto_id);
                }
            }
        }

        // cambiar el estado del pedido a cancelado
        db.prepare("UPDATE pedidos SET estado = 'cancelado' WHERE id = ?").run(pedidoId);

        return { success: true };
    });

    return ejecutarCancelacion();
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