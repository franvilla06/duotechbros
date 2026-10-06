// crea un nuevo codigo de verificacion (registro)
// limpia los codigos previos del mismo email o usuario
function crear(db, { usuario, email, password_hash, codigo, expira_en }) {
    db.prepare(
        "DELETE FROM codigos_verificacion WHERE (usuario = ? OR email = ?) AND tipo = 'registro'"
    ).run(usuario, email);

    return db
        .prepare(
            `
            INSERT INTO codigos_verificacion (usuario, email, password_hash, codigo, tipo, expira_en)
            VALUES (?, ?, ?, ?, 'registro', ?)
        `
        )
        .run(usuario, email, password_hash, codigo, expira_en);
}

// crea un codigo de recuperacion de contrasenia
// limpia los codigos previos del mismo email de tipo recuperacion
function crearRecuperacion(db, { usuario, email, codigo, expira_en }) {
    db.prepare(
        "DELETE FROM codigos_verificacion WHERE email = ? AND tipo = 'recuperacion'"
    ).run(email);

    return db
        .prepare(
            `
            INSERT INTO codigos_verificacion (usuario, email, codigo, tipo, expira_en)
            VALUES (?, ?, ?, 'recuperacion', ?)
        `
        )
        .run(usuario, email, codigo, expira_en);
}

// busca el codigo activo de un email por tipo
function buscarPorEmail(db, email, tipo = 'registro') {
    return db
        .prepare(
            `
            SELECT * FROM codigos_verificacion
            WHERE email = ? AND tipo = ? AND usado = 0
            ORDER BY id DESC
            LIMIT 1
        `
        )
        .get(email, tipo);
}

// incrementa el contador de intentos
function incrementarIntentos(db, id) {
    return db
        .prepare('UPDATE codigos_verificacion SET intentos = intentos + 1 WHERE id = ?')
        .run(id);
}

// marca el codigo como usado
function marcarUsado(db, id) {
    return db.prepare('UPDATE codigos_verificacion SET usado = 1 WHERE id = ?').run(id);
}

// elimina un codigo
function eliminar(db, id) {
    return db.prepare('DELETE FROM codigos_verificacion WHERE id = ?').run(id);
}

// limpia codigos vencidos o usados
function limpiarVencidos(db) {
    return db
        .prepare("DELETE FROM codigos_verificacion WHERE expira_en < datetime('now') OR usado = 1")
        .run();
}

module.exports = {
    crear,
    crearRecuperacion,
    buscarPorEmail,
    incrementarIntentos,
    marcarUsado,
    eliminar,
    limpiarVencidos,
};