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

function obtenerId(db, usuario) {
    const user = db.prepare('SELECT id FROM usuarios WHERE usuario = ?').get(usuario);
    return user ? user.id : null;
}

function obtenerPerfil(db, usuario) {
    return db.prepare('SELECT id, usuario, creado_en FROM usuarios WHERE usuario = ?').get(usuario);
}

// actualizar la contrasenia de un usuario
function actualizarPassword(db, usuario, passwordHash) {
    return db
        .prepare('UPDATE usuarios SET password_hash = ? WHERE usuario = ?')
        .run(passwordHash, usuario);
}

// eliminar la cuenta del usuario
// los pedidos historicos se mantienen porque la tabla pedidos no tiene fk hacia usuarios
function eliminar(db, usuario) {
    return db.prepare('DELETE FROM usuarios WHERE usuario = ?').run(usuario);
}

module.exports = {
    contarPorUsuario,
    buscarPorUsuario,
    crear,
    obtenerId,
    obtenerPerfil,
    actualizarPassword,
    eliminar,
};