function contarPorUsuario(db, usuario) {
    return db.prepare('SELECT COUNT(*) as count FROM usuarios WHERE usuario = ?').get(usuario);
}

function buscarPorUsuario(db, usuario) {
    return db.prepare('SELECT * FROM usuarios WHERE usuario = ?').get(usuario);
}

function crear(db, usuario, passwordHash) {
    return db
        .prepare('INSERT INTO usuarios (usuario, password_hash) VALUES (?, ?)')
        .run(usuario, passwordHash);
}

// crea un usuario incluyendo el email (usado tras verificar el codigo)
function crearConEmail(db, usuario, email, passwordHash) {
    return db
        .prepare('INSERT INTO usuarios (usuario, email, password_hash) VALUES (?, ?, ?)')
        .run(usuario, email, passwordHash);
}

function obtenerId(db, usuario) {
    const user = db.prepare('SELECT id FROM usuarios WHERE usuario = ?').get(usuario);
    return user ? user.id : null;
}

function obtenerPerfil(db, usuario) {
    return db
        .prepare('SELECT id, usuario, email, creado_en FROM usuarios WHERE usuario = ?')
        .get(usuario);
}

function actualizarPassword(db, usuario, passwordHash) {
    return db
        .prepare('UPDATE usuarios SET password_hash = ? WHERE usuario = ?')
        .run(passwordHash, usuario);
}

function eliminar(db, usuario) {
    return db.prepare('DELETE FROM usuarios WHERE usuario = ?').run(usuario);
}

module.exports = {
    contarPorUsuario,
    buscarPorUsuario,
    crear,
    crearConEmail,
    obtenerId,
    obtenerPerfil,
    actualizarPassword,
    eliminar,
};