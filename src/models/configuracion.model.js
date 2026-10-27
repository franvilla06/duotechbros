// obtiene todos los pares de configuración como un objeto clave-valor
export const obtenerTodo = async (pool) => {
    const [rows] = await pool.query('SELECT clave, valor FROM configuracion');
    const config = {};
    rows.forEach((fila) => {
        config[fila.clave] = fila.valor;
    });
    return config;
};

// obtiene el valor asociado a una clave de configuración
export const obtener = async (pool, clave) => {
    const [rows] = await pool.query('SELECT valor FROM configuracion WHERE clave = ?', [clave]);
    return rows[0] ? rows[0].valor : null;
};

// inserta o reemplaza el valor de una clave de configuración
export const actualizar = async (pool, clave, valor) => {
    await pool.query(
        `INSERT INTO configuracion (clave, valor) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
        [clave, valor === null || valor === undefined ? '' : String(valor)]
    );
};

// actualiza varias claves en una transacción para aplicarlas de forma atómica
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