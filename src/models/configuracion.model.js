export const obtenerTodo = async (pool) => {
    const [rows] = await pool.query('SELECT clave, valor FROM configuracion');
    const config = {};
    rows.forEach((fila) => {
        config[fila.clave] = fila.valor;
    });
    return config;
};

export const obtener = async (pool, clave) => {
    const [rows] = await pool.query('SELECT valor FROM configuracion WHERE clave = ?', [clave]);
    return rows[0] ? rows[0].valor : null;
};

export const actualizar = async (pool, clave, valor) => {
    await pool.query(
        `INSERT INTO configuracion (clave, valor) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
        [clave, valor === null || valor === undefined ? '' : String(valor)]
    );
};

// actualiza multiples claves en una transaccion
export const actualizarVarias = async (pool, cambios) => {
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
};