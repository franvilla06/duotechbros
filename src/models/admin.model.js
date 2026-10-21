export const buscarPorUsuario = async (pool, usuario) => {
    const [rows] = await pool.query('SELECT * FROM admin WHERE usuario = ?', [usuario]);
    return rows[0] || null;
};

export const contarPorUsuario = async (pool, usuario) => {
    const [rows] = await pool.query(
        'SELECT COUNT(*) as count FROM admin WHERE usuario = ?',
        [usuario]
    );
    return rows[0];
};

export const crear = async (pool, usuario, passwordHash) => {
    const [result] = await pool.query(
        'INSERT INTO admin (usuario, password_hash) VALUES (?, ?)',
        [usuario, passwordHash]
    );
    return { insertId: result.insertId };
};

// actualiza el nombre de usuario del admin
export const actualizarUsuario = async (pool, usuarioActual, usuarioNuevo) => {
    const [result] = await pool.query('UPDATE admin SET usuario = ? WHERE usuario = ?', [
        usuarioNuevo,
        usuarioActual,
    ]);
    return { affectedRows: result.affectedRows };
};

// actualiza la contrasenia del admin
export const actualizarPassword = async (pool, usuario, passwordHash) => {
    const [result] = await pool.query('UPDATE admin SET password_hash = ? WHERE usuario = ?', [
        passwordHash,
        usuario,
    ]);
    return { affectedRows: result.affectedRows };
};