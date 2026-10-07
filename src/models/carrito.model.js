async function obtenerUsuarioId(pool, nombreUsuario) {
    const [rows] = await pool.query('SELECT id FROM usuarios WHERE usuario = ?', [nombreUsuario]);
    return rows[0] ? rows[0].id : null;
}

async function obtenerProducto(pool, productoId) {
    const [rows] = await pool.query('SELECT id, stock FROM productos WHERE id = ?', [productoId]);
    return rows[0] || null;
}

async function obtenerProductoConNombre(pool, productoId) {
    const [rows] = await pool.query(
        'SELECT id, nombre, stock FROM productos WHERE id = ?',
        [productoId]
    );
    return rows[0] || null;
}

async function buscarItem(pool, usuarioId, productoId) {
    const [rows] = await pool.query(
        'SELECT id, cantidad FROM carrito WHERE usuario_id = ? AND producto_id = ?',
        [usuarioId, productoId]
    );
    return rows[0] || null;
}

async function actualizarCantidad(pool, itemId, cantidad) {
    await pool.query('UPDATE carrito SET cantidad = ? WHERE id = ?', [cantidad, itemId]);
}

async function insertarItem(pool, usuarioId, productoId, cantidad) {
    const [result] = await pool.query(
        'INSERT INTO carrito (usuario_id, producto_id, cantidad) VALUES (?, ?, ?)',
        [usuarioId, productoId, cantidad]
    );
    return { insertId: result.insertId };
}

async function listarItems(pool, usuarioId) {
    const [rows] = await pool.query(
        `SELECT
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
         ORDER BY c.agregado_en DESC`,
        [usuarioId]
    );
    return rows;
}

async function buscarItemDeUsuario(pool, itemId, usuarioId) {
    const [rows] = await pool.query(
        'SELECT id FROM carrito WHERE id = ? AND usuario_id = ?',
        [itemId, usuarioId]
    );
    return rows[0] || null;
}

async function eliminarItem(pool, itemId) {
    await pool.query('DELETE FROM carrito WHERE id = ?', [itemId]);
}

async function eliminarItemDeUsuario(pool, itemId, usuarioId) {
    const [result] = await pool.query(
        'DELETE FROM carrito WHERE id = ? AND usuario_id = ?',
        [itemId, usuarioId]
    );
    return { affectedRows: result.affectedRows };
}

async function vaciar(pool, usuarioId) {
    const [result] = await pool.query('DELETE FROM carrito WHERE usuario_id = ?', [usuarioId]);
    return { affectedRows: result.affectedRows };
}

async function listarItemsParaPedido(pool, usuarioId) {
    const [rows] = await pool.query(
        `SELECT
            c.id,
            c.cantidad,
            p.id AS producto_id,
            p.nombre,
            p.precio,
            p.stock
         FROM carrito c
         INNER JOIN productos p ON p.id = c.producto_id
         WHERE c.usuario_id = ?`,
        [usuarioId]
    );
    return rows;
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