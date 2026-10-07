async function contarPorUsuario(pool, usuario) {
    const [rows] = await pool.query(
        'SELECT COUNT(*) as count FROM usuarios WHERE usuario = ?',
        [usuario]
    );
    return rows[0];
}

async function buscarPorUsuario(pool, usuario) {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);
    return rows[0] || null;
}

async function buscarPorEmail(pool, email) {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    return rows[0] || null;
}

async function crear(pool, usuario, passwordHash) {
    const [result] = await pool.query(
        'INSERT INTO usuarios (usuario, password_hash) VALUES (?, ?)',
        [usuario, passwordHash]
    );
    return { insertId: result.insertId };
}

async function crearConEmail(pool, usuario, email, passwordHash) {
    const [result] = await pool.query(
        'INSERT INTO usuarios (usuario, email, password_hash) VALUES (?, ?, ?)',
        [usuario, email, passwordHash]
    );
    return { insertId: result.insertId };
}

async function obtenerId(pool, usuario) {
    const [rows] = await pool.query('SELECT id FROM usuarios WHERE usuario = ?', [usuario]);
    return rows[0] ? rows[0].id : null;
}

async function obtenerPerfil(pool, usuario) {
    const [rows] = await pool.query(
        'SELECT id, usuario, email, creado_en FROM usuarios WHERE usuario = ?',
        [usuario]
    );
    return rows[0] || null;
}

async function actualizarPassword(pool, usuario, passwordHash) {
    const [result] = await pool.query(
        'UPDATE usuarios SET password_hash = ? WHERE usuario = ?',
        [passwordHash, usuario]
    );
    return { affectedRows: result.affectedRows };
}

async function eliminar(pool, usuario) {
    const [result] = await pool.query('DELETE FROM usuarios WHERE usuario = ?', [usuario]);
    return { affectedRows: result.affectedRows };
}

module.exports = {
    contarPorUsuario,
    buscarPorUsuario,
    buscarPorEmail,
    crear,
    crearConEmail,
    obtenerId,
    obtenerPerfil,
    actualizarPassword,
    eliminar,
};