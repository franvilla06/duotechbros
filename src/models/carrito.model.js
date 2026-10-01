function obtenerUsuarioId(db, nombreUsuario) {
    const user = db.prepare('SELECT id FROM usuarios WHERE usuario = ?').get(nombreUsuario);
    return user ? user.id : null;
}

function obtenerProducto(db, productoId) {
    return db.prepare('SELECT id, stock FROM productos WHERE id = ?').get(productoId);
}

// devuelve el producto con su nombre para mensajes al usuario
function obtenerProductoConNombre(db, productoId) {
    return db.prepare('SELECT id, nombre, stock FROM productos WHERE id = ?').get(productoId);
}

function buscarItem(db, usuarioId, productoId) {
    return db
        .prepare('SELECT id, cantidad FROM carrito WHERE usuario_id = ? AND producto_id = ?')
        .get(usuarioId, productoId);
}

function actualizarCantidad(db, itemId, cantidad) {
    return db.prepare('UPDATE carrito SET cantidad = ? WHERE id = ?').run(cantidad, itemId);
}

function insertarItem(db, usuarioId, productoId, cantidad) {
    return db
        .prepare('INSERT INTO carrito (usuario_id, producto_id, cantidad) VALUES (?, ?, ?)')
        .run(usuarioId, productoId, cantidad);
}

function listarItems(db, usuarioId) {
    return db
        .prepare(
            `
            SELECT
                c.id,
                c.cantidad,
                c.agregado_en,
                p.id AS producto_id,
                p.nombre,
                p.descripcion,
                p.precio,
                p.imagen_url,
                p.categoria,
                p.stock
            FROM carrito c
            INNER JOIN productos p ON p.id = c.producto_id
            WHERE c.usuario_id = ?
            ORDER BY c.agregado_en DESC
        `
        )
        .all(usuarioId);
}

function buscarItemDeUsuario(db, itemId, usuarioId) {
    return db.prepare('SELECT id FROM carrito WHERE id = ? AND usuario_id = ?').get(itemId, usuarioId);
}

function eliminarItem(db, itemId) {
    return db.prepare('DELETE FROM carrito WHERE id = ?').run(itemId);
}

function eliminarItemDeUsuario(db, itemId, usuarioId) {
    return db
        .prepare('DELETE FROM carrito WHERE id = ? AND usuario_id = ?')
        .run(itemId, usuarioId);
}

function vaciar(db, usuarioId) {
    return db.prepare('DELETE FROM carrito WHERE usuario_id = ?').run(usuarioId);
}

function listarItemsParaPedido(db, usuarioId) {
    return db
        .prepare(
            `
            SELECT
                c.id,
                c.cantidad,
                p.id AS producto_id,
                p.nombre,
                p.precio,
                p.stock
            FROM carrito c
            INNER JOIN productos p ON p.id = c.producto_id
            WHERE c.usuario_id = ?
        `
        )
        .all(usuarioId);
}

module.exports = {
    obtenerUsuarioId,
    obtenerProducto,
    obtenerProductoConNombre,
    buscarItem,
    actualizarCantidad,
    insertarItem,
    listarItems,
    buscarItemDeUsuario,
    eliminarItem,
    eliminarItemDeUsuario,
    vaciar,
    listarItemsParaPedido,
};