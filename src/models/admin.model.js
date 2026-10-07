async function buscarPorUsuario(pool, usuario) {
    const [rows] = await pool.query('SELECT * FROM admin WHERE usuario = ?', [usuario]);
    return rows[0] || null;
}

async function contarPorUsuario(pool, usuario) {
    const [rows] = await pool.query(
        'SELECT COUNT(*) as count FROM admin WHERE usuario = ?',
        [usuario]
    );
    return rows[0];
}

async function crear(pool, usuario, passwordHash) {
    const [result] = await pool.query(
        'INSERT INTO admin (usuario, password_hash) VALUES (?, ?)',
        [usuario, passwordHash]
    );
    return { insertId: result.insertId };
}

module.exports = { buscarPorUsuario, contarPorUsuario, crear };