async function obtenerTodo(pool) {
    const [rows] = await pool.query('SELECT clave, valor FROM configuracion');
    const config = {};
    rows.forEach((fila) => {
        config[fila.clave] = fila.valor;
    });
    return config;
}

async function obtener(pool, clave) {
    const [rows] = await pool.query('SELECT valor FROM configuracion WHERE clave = ?', [clave]);
    return rows[0] ? rows[0].valor : null;
}

async function actualizar(pool, clave, valor) {
    await pool.query(
        `INSERT INTO configuracion (clave, valor) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
        [clave, valor === null || valor === undefined ? '' : String(valor)]
    );
}

// actualiza multiples claves en una transaccion
async function actualizarVarias(pool, cambios) {
    const conexion = await pool.getConnection();
    try {
        await conexion.beginTransaction();

        for (const [clave, valor] of Object.entries(cambios)) {
            await conexion.query(
                `INSERT INTO configuracion (clave, valor) VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
                [clave, valor === null || valor === undefined ? '' : String(valor)]
            );
        }

        await conexion.commit();
    } catch (error) {
        await conexion.rollback();
        throw error;
    } finally {
        conexion.release();
    }
}

module.exports = { obtenerTodo, obtener, actualizar, actualizarVarias };