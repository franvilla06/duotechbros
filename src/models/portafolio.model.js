async function listar(pool) {
    const [rows] = await pool.query('SELECT * FROM portafolio ORDER BY fecha DESC');
    return rows;
}

async function crear(pool, trabajo) {
    const [result] = await pool.query(
        `INSERT INTO portafolio (titulo, descripcion, imagen_url, imagenes, tipo_reparacion, fecha_inicio, fecha_fin)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            trabajo.titulo,
            trabajo.descripcion,
            trabajo.imagen_url,
            trabajo.imagenes,
            trabajo.tipo_reparacion,
            trabajo.fecha_inicio,
            trabajo.fecha_fin,
        ]
    );
    return { insertId: result.insertId };
}

async function actualizar(pool, id, trabajo) {
    const campoImagenes = trabajo.imagenes === undefined ? '' : ', imagenes = ?';
    const valores = [
        trabajo.titulo,
        trabajo.descripcion,
        trabajo.imagen_url,
    ];
    if (trabajo.imagenes !== undefined) valores.push(trabajo.imagenes);
    valores.push(
        trabajo.tipo_reparacion,
        trabajo.fecha_inicio,
        trabajo.fecha_fin,
        id
    );

    const [result] = await pool.query(
        `UPDATE portafolio
         SET titulo = ?, descripcion = ?, imagen_url = ?${campoImagenes}, tipo_reparacion = ?,
             fecha_inicio = ?, fecha_fin = ?
         WHERE id = ?`,
        valores
    );
    return { affectedRows: result.affectedRows };
}

async function eliminar(pool, id) {
    const [result] = await pool.query('DELETE FROM portafolio WHERE id = ?', [id]);
    return { affectedRows: result.affectedRows };
}

module.exports = { listar, crear, actualizar, eliminar };