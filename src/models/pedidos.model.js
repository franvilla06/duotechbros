function crear(db, pedido) {
    return db
        .prepare(
            `
            INSERT INTO pedidos (nombre_cliente, telefono, email, modelo_celular, descripcion_problema)
            VALUES (?, ?, ?, ?, ?)
        `
        )
        .run(
            pedido.nombre_cliente,
            pedido.telefono,
            pedido.email,
            pedido.modelo_celular,
            pedido.descripcion_problema
        );
}

function listar(db) {
    return db.prepare('SELECT * FROM pedidos ORDER BY creado_en DESC').all();
}

function actualizarEstado(db, id, estado) {
    return db.prepare('UPDATE pedidos SET estado = ? WHERE id = ?').run(estado, id);
}

function actualizarNotas(db, id, notas) {
    return db.prepare('UPDATE pedidos SET notas = ? WHERE id = ?').run(notas, id);
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

module.exports = {
    crear,
    listar,
    actualizarEstado,
    actualizarNotas,
    eliminar,
    crearPedidoDeUsuario,
    insertarItem,
};
