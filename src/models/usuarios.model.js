export const contarPorUsuario = async (pool, usuario) => {
    const [rows] = await pool.query(
        'SELECT COUNT(*) as count FROM usuarios WHERE usuario = ?',
        [usuario]
    );
    return rows[0];
};

export const buscarPorUsuario = async (pool, usuario) => {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);
    return rows[0] || null;
};

export const buscarPorEmail = async (pool, email) => {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    return rows[0] || null;
};

export const crear = async (pool, usuario, passwordHash) => {
    const [result] = await pool.query(
        'INSERT INTO usuarios (usuario, password_hash) VALUES (?, ?)',
        [usuario, passwordHash]
    );
    return { insertId: result.insertId };
};

export const crearConEmail = async (pool, usuario, email, passwordHash) => {
    const [result] = await pool.query(
        'INSERT INTO usuarios (usuario, email, password_hash) VALUES (?, ?, ?)',
        [usuario, email, passwordHash]
    );
    return { insertId: result.insertId };
};

export const obtenerId = async (pool, usuario) => {
    const [rows] = await pool.query('SELECT id FROM usuarios WHERE usuario = ?', [usuario]);
    return rows[0] ? rows[0].id : null;
};

export const obtenerPerfil = async (pool, usuario) => {
    const [rows] = await pool.query(
        'SELECT id, usuario, email, creado_en FROM usuarios WHERE usuario = ?',
        [usuario]
    );
    return rows[0] || null;
};

export const actualizarPassword = async (pool, usuario, passwordHash) => {
    const [result] = await pool.query(
        'UPDATE usuarios SET password_hash = ? WHERE usuario = ?',
        [passwordHash, usuario]
    );
    return { affectedRows: result.affectedRows };
};

// actualiza el email de un usuario
export const actualizarEmail = async (pool, usuario, email) => {
    const [result] = await pool.query(
        'UPDATE usuarios SET email = ? WHERE usuario = ?',
        [email, usuario]
    );
    return { affectedRows: result.affectedRows };
};

// cuenta cuantos usuarios tienen un email (para validar duplicados)
export const contarPorEmail = async (pool, email) => {
    const [rows] = await pool.query(
        'SELECT COUNT(*) as count FROM usuarios WHERE email = ?',
        [email]
    );
    return rows[0];
};

export const eliminar = async (pool, usuario) => {
    const [result] = await pool.query('DELETE FROM usuarios WHERE usuario = ?', [usuario]);
    return { affectedRows: result.affectedRows };
};

// incrementa los intentos fallidos y bloquea si llega a 5
export const registrarIntentoFallido = async (pool, usuario) => {
    await pool.query(
        `UPDATE usuarios
         SET bloqueado_hasta = IF(intentos_fallidos + 1 >= 5, DATE_ADD(NOW(), INTERVAL 15 MINUTE), bloqueado_hasta),
             intentos_fallidos = intentos_fallidos + 1
         WHERE usuario = ?`,
        [usuario]
    );
};

// resetea los intentos al iniciar sesion correctamente
export const resetearIntentos = async (pool, usuario) => {
    await pool.query(
        'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE usuario = ?',
        [usuario]
    );
};

export const incrementarTokenVersion = async (pool, usuario) => {
    await pool.query(
        'UPDATE usuarios SET token_version = token_version + 1 WHERE usuario = ?',
        [usuario]
    );
};