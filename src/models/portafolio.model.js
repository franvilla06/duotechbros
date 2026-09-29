function listar(db) {
    return db.prepare('SELECT * FROM portafolio ORDER BY fecha DESC').all();
}

function crear(db, trabajo) {
    return db
        .prepare(
            `
            INSERT INTO portafolio (titulo, descripcion, imagen_url, tipo_reparacion)
            VALUES (?, ?, ?, ?)
        `
        )
        .run(trabajo.titulo, trabajo.descripcion, trabajo.imagen_url, trabajo.tipo_reparacion);
}

function actualizar(db, id, trabajo) {
    return db
        .prepare(
            `
            UPDATE portafolio
            SET titulo = ?, descripcion = ?, imagen_url = ?, tipo_reparacion = ?
            WHERE id = ?
        `
        )
        .run(trabajo.titulo, trabajo.descripcion, trabajo.imagen_url, trabajo.tipo_reparacion, id);
}

function eliminar(db, id) {
    return db.prepare('DELETE FROM portafolio WHERE id = ?').run(id);
}

module.exports = { listar, crear, actualizar, eliminar };
