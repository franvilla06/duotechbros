// devuelve toda la configuracion como un objeto clave-valor
function obtenerTodo(db) {
    const filas = db.prepare('SELECT clave, valor FROM configuracion').all();

    const config = {};
    filas.forEach((fila) => {
        config[fila.clave] = fila.valor;
    });
    return config;
}

// devuelve el valor de una clave especifica
function obtener(db, clave) {
    const fila = db.prepare('SELECT valor FROM configuracion WHERE clave = ?').get(clave);
    return fila ? fila.valor : null;
}

// actualiza o inserta una clave-valor
function actualizar(db, clave, valor) {
    return db
        .prepare(
            `
            INSERT INTO configuracion (clave, valor) VALUES (?, ?)
            ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor
        `
        )
        .run(clave, valor === null || valor === undefined ? '' : String(valor));
}

// actualiza multiples claves de una sola vez
// se hace dentro de una transaccion para no dejar la config a medias
function actualizarVarias(db, cambios) {
    const ejecutar = db.transaction(() => {
        Object.entries(cambios).forEach(([clave, valor]) => {
            actualizar(db, clave, valor);
        });
    });

    return ejecutar();
}

module.exports = { obtenerTodo, obtener, actualizar, actualizarVarias };