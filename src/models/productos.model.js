function listar(db) {
    return db.prepare('SELECT * FROM productos ORDER BY id DESC').all();
}

function crear(db, producto) {
    return db
        .prepare(
            `
            INSERT INTO productos (nombre, descripcion, precio, imagen_url, categoria, stock)
            VALUES (?, ?, ?, ?, ?, ?)
        `
        )
        .run(
            producto.nombre,
            producto.descripcion,
            producto.precio,
            producto.imagen_url,
            producto.categoria,
            producto.stock
        );
}

function actualizar(db, id, producto) {
    return db
        .prepare(
            `
            UPDATE productos
            SET nombre = ?, descripcion = ?, precio = ?, imagen_url = ?, categoria = ?, stock = ?
            WHERE id = ?
        `
        )
        .run(
            producto.nombre,
            producto.descripcion,
            producto.precio,
            producto.imagen_url,
            producto.categoria,
            producto.stock,
            id
        );
}

function eliminar(db, id) {
    return db.prepare('DELETE FROM productos WHERE id = ?').run(id);
}

function descontarStock(db, productoId, cantidad) {
    return db.prepare('UPDATE productos SET stock = stock - ? WHERE id = ?').run(cantidad, productoId);
}

module.exports = { listar, crear, actualizar, eliminar, descontarStock };
