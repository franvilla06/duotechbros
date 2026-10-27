// busca un administrador por su nombre de usuario
export const buscarPorUsuario = async (pool, usuario) => {
    const [rows] = await pool.query('SELECT * FROM admin WHERE usuario = ?', [usuario]);
    return rows[0] || null;
};

// cuenta las coincidencias de un nombre de usuario de administrador
export const contarPorUsuario = async (pool, usuario) => {
    const [rows] = await pool.query(
        'SELECT COUNT(*) as count FROM admin WHERE usuario = ?',
        [usuario]
    );
    return rows[0];
};

// crea un administrador con la contraseña ya cifrada
export const crear = async (pool, usuario, passwordHash) => {
    const [result] = await pool.query(
        'INSERT INTO admin (usuario, password_hash) VALUES (?, ?)',
        [usuario, passwordHash]
    );
    return { insertId: result.insertId };
};

// cambia el nombre de usuario del administrador
export const actualizarUsuario = async (pool, usuarioActual, usuarioNuevo) => {
    const [result] = await pool.query('UPDATE admin SET usuario = ? WHERE usuario = ?', [
        usuarioNuevo,
        usuarioActual,
    ]);
    return { affectedRows: result.affectedRows };
};

// guarda el nuevo hash de contraseña del administrador
export const actualizarPassword = async (pool, usuario, passwordHash) => {
    const [result] = await pool.query('UPDATE admin SET password_hash = ? WHERE usuario = ?', [
        passwordHash,
        usuario,
    ]);
    return { affectedRows: result.affectedRows };
};

// registra un intento fallido y aplica un bloqueo temporal al alcanzar cinco
export const registrarIntentoFallido = async (pool, usuario) => {
    await pool.query(
        `UPDATE admin
         SET bloqueado_hasta = IF(intentos_fallidos + 1 >= 5, DATE_ADD(NOW(), INTERVAL 15 MINUTE), bloqueado_hasta),
             intentos_fallidos = intentos_fallidos + 1
         WHERE usuario = ?`,
        [usuario]
    );
};

// elimina el bloqueo y restablece los intentos fallidos del administrador
export const resetearIntentos = async (pool, usuario) => {
    await pool.query(
        'UPDATE admin SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE usuario = ?',
        [usuario]
    );
};

// incrementa la versión para invalidar los tokens anteriores del administrador
export const incrementarTokenVersion = async (pool, usuario) => {
    await pool.query('UPDATE admin SET token_version = token_version + 1 WHERE usuario = ?', [
        usuario,
    ]);
};