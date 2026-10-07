async function crear(pool, { usuario, email, password_hash, codigo, expira_en }) {
    // borrar codigos de registro previos
    await pool.query(
        "DELETE FROM codigos_verificacion WHERE (usuario = ? OR email = ?) AND tipo = 'registro'",
        [usuario, email]
    );

    const [result] = await pool.query(
        `INSERT INTO codigos_verificacion (usuario, email, password_hash, codigo, tipo, expira_en)
         VALUES (?, ?, ?, ?, 'registro', ?)`,
        [usuario, email, password_hash, codigo, expira_en]
    );
    return { insertId: result.insertId };
}

async function crearRecuperacion(pool, { usuario, email, codigo, expira_en }) {
    // borrar codigos de recuperacion previos
    await pool.query(
        "DELETE FROM codigos_verificacion WHERE email = ? AND tipo = 'recuperacion'",
        [email]
    );

    const [result] = await pool.query(
        `INSERT INTO codigos_verificacion (usuario, email, codigo, tipo, expira_en)
         VALUES (?, ?, ?, 'recuperacion', ?)`,
        [usuario, email, codigo, expira_en]
    );
    return { insertId: result.insertId };
}

async function buscarPorEmail(pool, email, tipo = 'registro') {
    const [rows] = await pool.query(
        `SELECT * FROM codigos_verificacion
         WHERE email = ? AND tipo = ? AND usado = 0
         ORDER BY id DESC
         LIMIT 1`,
        [email, tipo]
    );
    return rows[0] || null;
}

async function incrementarIntentos(pool, id) {
    await pool.query(
        'UPDATE codigos_verificacion SET intentos = intentos + 1 WHERE id = ?',
        [id]
    );
}

async function marcarUsado(pool, id) {
    await pool.query('UPDATE codigos_verificacion SET usado = 1 WHERE id = ?', [id]);
}

async function eliminar(pool, id) {
    await pool.query('DELETE FROM codigos_verificacion WHERE id = ?', [id]);
}

async function limpiarVencidos(pool) {
    await pool.query('DELETE FROM codigos_verificacion WHERE expira_en < NOW() OR usado = 1');
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