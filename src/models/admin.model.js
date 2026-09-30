function buscarPorUsuario(db, usuario) {
    return db.prepare('SELECT * FROM admin WHERE usuario = ?').get(usuario);
}

function contarPorUsuario(db, usuario) {
    return db.prepare('SELECT COUNT(*) as count FROM admin WHERE usuario = ?').get(usuario);
}

function crear(db, usuario, passwordHash) {
    return db
        .prepare('INSERT INTO admin (usuario, password_hash) VALUES (?, ?)')
        .run(usuario, passwordHash);
}

module.exports = { buscarPorUsuario, contarPorUsuario, crear };
