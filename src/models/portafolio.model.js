function listar(db) {
    return db.prepare('SELECT * FROM portafolio ORDER BY fecha DESC').all();
}

function crear(db, trabajo) {
    return db
        .prepare(
            `
            INSERT INTO portafolio (
                titulo, descripcion, imagen_url, tipo_reparacion, fecha_inicio, fecha_fin
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `
        )
        .run(
            trabajo.titulo,
            trabajo.descripcion,
            trabajo.imagen_url,
            trabajo.tipo_reparacion,
            trabajo.fecha_inicio,
            trabajo.fecha_fin
        );
}

function actualizar(db, id, trabajo) {
    return db
        .prepare(
            `
            UPDATE portafolio
            SET titulo = ?, descripcion = ?, imagen_url = ?, tipo_reparacion = ?,
                fecha_inicio = ?, fecha_fin = ?
            WHERE id = ?
        `
        )
        .run(
            trabajo.titulo,
            trabajo.descripcion,
            trabajo.imagen_url,
            trabajo.tipo_reparacion,
            trabajo.fecha_inicio,
            trabajo.fecha_fin,
            id
        );
}

function eliminar(db, id) {
    return db.prepare('DELETE FROM portafolio WHERE id = ?').run(id);
}

module.exports = { listar, crear, actualizar, eliminar };