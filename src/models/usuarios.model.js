// cuenta las coincidencias de un nombre de usuario
export const contarPorUsuario = async (pool, usuario) => {
    const [rows] = await pool.query(
        'SELECT COUNT(*) as count FROM usuarios WHERE usuario = ?',
        [usuario]
    );
    return rows[0];
};

// busca un usuario por su nombre de usuario
export const buscarPorUsuario = async (pool, usuario) => {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);
    return rows[0] || null;
};

// busca un usuario por su dirección de correo electrónico
export const buscarPorEmail = async (pool, email) => {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    return rows[0] || null;
};

// crea un usuario sin asociar todavía un correo electrónico
export const crear = async (pool, usuario, passwordHash) => {
    const [result] = await pool.query(
        'INSERT INTO usuarios (usuario, password_hash) VALUES (?, ?)',
        [usuario, passwordHash]
    );
    return { insertId: result.insertId };
};

// crea un usuario con correo y contraseña cifrada
export const crearConEmail = async (pool, usuario, email, passwordHash) => {
    const [result] = await pool.query(
        'INSERT INTO usuarios (usuario, email, password_hash) VALUES (?, ?, ?)',
        [usuario, email, passwordHash]
    );
    return { insertId: result.insertId };
};

// obtiene el identificador interno de un usuario
export const obtenerId = async (pool, usuario) => {
    const [rows] = await pool.query('SELECT id FROM usuarios WHERE usuario = ?', [usuario]);
    return rows[0] ? rows[0].id : null;
};

// obtiene los datos de perfil que pueden mostrarse al usuario
export const obtenerPerfil = async (pool, usuario) => {
    const [rows] = await pool.query(
        'SELECT id, usuario, email, creado_en FROM usuarios WHERE usuario = ?',
        [usuario]
    );
    return rows[0] || null;
};

// guarda el nuevo hash de contraseña del usuario
export const actualizarPassword = async (pool, usuario, passwordHash) => {
    const [result] = await pool.query(
        'UPDATE usuarios SET password_hash = ? WHERE usuario = ?',
        [passwordHash, usuario]
    );
    return { affectedRows: result.affectedRows };
};

// cambia la dirección de correo electrónico del usuario
export const actualizarEmail = async (pool, usuario, email) => {
    const [result] = await pool.query(
        'UPDATE usuarios SET email = ? WHERE usuario = ?',
        [email, usuario]
    );
    return { affectedRows: result.affectedRows };
};

// cuenta los usuarios que ya tienen asociada una dirección de correo
export const contarPorEmail = async (pool, email) => {
    const [rows] = await pool.query(
        'SELECT COUNT(*) as count FROM usuarios WHERE email = ?',
        [email]
    );
    return rows[0];
};

// elimina una cuenta por su nombre de usuario
export const eliminar = async (pool, usuario) => {
    const [result] = await pool.query('DELETE FROM usuarios WHERE usuario = ?', [usuario]);
    return { affectedRows: result.affectedRows };
};

// registra un intento fallido y aplica un bloqueo temporal al alcanzar cinco
export const registrarIntentoFallido = async (pool, usuario) => {
    await pool.query(
        `UPDATE usuarios
         SET bloqueado_hasta = IF(intentos_fallidos + 1 >= 5, DATE_ADD(NOW(), INTERVAL 15 MINUTE), bloqueado_hasta),
             intentos_fallidos = intentos_fallidos + 1
         WHERE usuario = ?`,
        [usuario]
    );
};

// elimina el bloqueo y restablece los intentos fallidos del usuario
export const resetearIntentos = async (pool, usuario) => {
    await pool.query(
        'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE usuario = ?',
        [usuario]
    );
};

// incrementa la versión para invalidar los tokens anteriores del usuario
export const incrementarTokenVersion = async (pool, usuario) => {
    await pool.query(
        'UPDATE usuarios SET token_version = token_version + 1 WHERE usuario = ?',
        [usuario]
    );
};