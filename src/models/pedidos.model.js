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

// HISTORIAL DEL USUARIO

// listar los pedidos de un usuario con el resumen de items y total
// solo devuelve pedidos con usuario_id asignado (los del carrito)
function listarPorUsuario(db, usuarioId) {
    return db
        .prepare(
            `
            SELECT
                p.id,
                p.estado,
                p.creado_en,
                p.notas,
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

// verificar que un pedido pertenezca al usuario
function obtenerPedidoDeUsuario(db, pedidoId, usuarioId) {
    return db
        .prepare(
            `
            SELECT id, estado, creado_en, notas
            FROM pedidos
            WHERE id = ? AND usuario_id = ?
        `
        )
        .get(pedidoId, usuarioId);
}

// listar los items de un pedido
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

module.exports = {
    crear,
    listar,
    actualizarEstado,
    actualizarNotas,
    eliminar,
    crearPedidoDeUsuario,
    insertarItem,
    listarPorUsuario,
    obtenerPedidoDeUsuario,
    listarItemsDePedido,
};