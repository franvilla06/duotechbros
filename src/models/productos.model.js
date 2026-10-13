async function listar(pool) {
    const [rows] = await pool.query('SELECT * FROM productos ORDER BY id DESC');
    return rows;
}

async function crear(pool, producto) {
    const [result] = await pool.query(
        `INSERT INTO productos (nombre, descripcion, precio, imagen_url, imagenes, categoria, stock)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            producto.nombre,
            producto.descripcion,
            producto.precio,
            producto.imagen_url,
            producto.imagenes,
            producto.categoria,
            producto.stock,
        ]
    );
    return { insertId: result.insertId };
}

async function actualizar(pool, id, producto) {
    const camposImagenes = producto.imagenes === undefined ? '' : ', imagenes = ?';
    const valores = [
        producto.nombre,
        producto.descripcion,
        producto.precio,
        producto.imagen_url,
    ];
    if (producto.imagenes !== undefined) valores.push(producto.imagenes);
    valores.push(producto.categoria, producto.stock, id);

    const [result] = await pool.query(
        `UPDATE productos
         SET nombre = ?, descripcion = ?, precio = ?, imagen_url = ?${camposImagenes}, categoria = ?, stock = ?
         WHERE id = ?`,
        valores
    );
    return { affectedRows: result.affectedRows };
}

async function eliminar(pool, id) {
    const [result] = await pool.query('DELETE FROM productos WHERE id = ?', [id]);
    return { affectedRows: result.affectedRows };
}

// descuenta stock de un producto (dentro de una transaccion se pasa la conexion)
async function descontarStock(pool, productoId, cantidad) {
    const [result] = await pool.query(
        'UPDATE productos SET stock = stock - ? WHERE id = ?',
        [cantidad, productoId]
    );
    return { affectedRows: result.affectedRows };
}

// restaura stock (usado al cancelar una compra)
async function restaurarStock(pool, productoId, cantidad) {
    const [result] = await pool.query(
        'UPDATE productos SET stock = stock + ? WHERE id = ?',
        [cantidad, productoId]
    );
    return { affectedRows: result.affectedRows };
}

module.exports = { listar, crear, actualizar, eliminar, descontarStock, restaurarStock };