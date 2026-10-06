// crea un nuevo codigo de verificacion
// limpia los codigos previos del mismo email o usuario
function crear(db, { usuario, email, password_hash, codigo, expira_en }) {
    // borrar codigos anteriores del mismo usuario o email (evita acumulacion)
    db.prepare('DELETE FROM codigos_verificacion WHERE usuario = ? OR email = ?').run(usuario, email);

    return db
        .prepare(
            `
            INSERT INTO codigos_verificacion (usuario, email, password_hash, codigo, expira_en)
            VALUES (?, ?, ?, ?, ?)
        `
        )
        .run(usuario, email, password_hash, codigo, expira_en);
}

// busca el codigo activo de un email
// devuelve null si no existe
function buscarPorEmail(db, email) {
    return db
        .prepare(
            `
            SELECT * FROM codigos_verificacion
            WHERE email = ? AND usado = 0
            ORDER BY id DESC
            LIMIT 1
        `
        )
        .get(email);
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
// se usa datetime con comillas simples porque sqlite lo interpreta como string
function limpiarVencidos(db) {
    return db
        .prepare("DELETE FROM codigos_verificacion WHERE expira_en < datetime('now') OR usado = 1")
        .run();
}

module.exports = {
    crear,
    buscarPorEmail,
    incrementarIntentos,
    marcarUsado,
    eliminar,
    limpiarVencidos,
};