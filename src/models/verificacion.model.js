export const crear = async (pool, { usuario, email, password_hash, codigo, expira_en }) => {
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
};

export const crearRecuperacion = async (pool, { usuario, email, codigo, expira_en }) => {
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
};

export const buscarPorEmail = async (pool, email, tipo = 'registro') => {
    const [rows] = await pool.query(
        `SELECT * FROM codigos_verificacion
         WHERE email = ? AND tipo = ? AND usado = 0
         ORDER BY id DESC
         LIMIT 1`,
        [email, tipo]
    );
    return rows[0] || null;
};

export const incrementarIntentos = async (pool, id) => {
    const [result] = await pool.query(
        'UPDATE codigos_verificacion SET intentos = intentos + 1 WHERE id = ? AND intentos < 5',
        [id]
    );
    return result;
};

export const marcarUsado = async (pool, id) => {
    await pool.query('UPDATE codigos_verificacion SET usado = 1 WHERE id = ?', [id]);
};

export const eliminar = async (pool, id) => {
    await pool.query('DELETE FROM codigos_verificacion WHERE id = ?', [id]);
};

export const limpiarVencidos = async (pool) => {
    await pool.query('DELETE FROM codigos_verificacion WHERE expira_en < NOW() OR usado = 1');
};