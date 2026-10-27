// crea un código de registro y elimina los códigos de registro anteriores relacionados
export const crear = async (pool, { usuario, email, password_hash, codigo, expira_en }) => {
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

// crea un código de recuperación tras eliminar solicitudes anteriores del mismo correo
export const crearRecuperacion = async (pool, { usuario, email, codigo, expira_en }) => {
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

// busca el código activo más reciente para el correo y tipo indicados
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

// suma un intento fallido mientras no se haya alcanzado el límite permitido
export const incrementarIntentos = async (pool, id) => {
    const [result] = await pool.query(
        'UPDATE codigos_verificacion SET intentos = intentos + 1 WHERE id = ? AND intentos < 5',
        [id]
    );
    return result;
};

// marca el código como utilizado para impedir que vuelva a aceptarse
export const marcarUsado = async (pool, id) => {
    await pool.query('UPDATE codigos_verificacion SET usado = 1 WHERE id = ?', [id]);
};

// elimina un código de verificación por su identificador
export const eliminar = async (pool, id) => {
    await pool.query('DELETE FROM codigos_verificacion WHERE id = ?', [id]);
};

// elimina los códigos vencidos o que ya fueron utilizados
export const limpiarVencidos = async (pool) => {
    await pool.query('DELETE FROM codigos_verificacion WHERE expira_en < NOW() OR usado = 1');
};