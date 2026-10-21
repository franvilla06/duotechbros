const obtenerFiltroFecha = (rango) => {
    if (rango === 'hoy') return ' AND DATE(creado_en) = CURDATE()';
    if (rango === 'semana') return ' AND creado_en >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    if (rango === 'mes') return ' AND creado_en >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
    return '';
};

export const pedidosPorEstado = async (pool, rango = 'todos') => {
    const filtro = obtenerFiltroFecha(rango);
    const [rows] = await pool.query(
        `SELECT tipo, estado, COUNT(*) AS total
         FROM pedidos
         WHERE 1=1 ${filtro}
         GROUP BY tipo, estado`
    );
    return rows;
};

export const productosMasVendidos = async (pool, limite = 10, rango = 'todos') => {
    const limiteSeguro = Math.max(1, Math.min(100, parseInt(limite) || 10));
    const filtro = obtenerFiltroFecha(rango);

    const [rows] = await pool.query(
        `SELECT
            pi.producto_id,
            pi.nombre_producto,
            SUM(pi.cantidad) AS total_vendido,
            SUM(pi.subtotal) AS total_recaudado
         FROM pedido_items pi
         INNER JOIN pedidos p ON p.id = pi.pedido_id
         WHERE p.tipo = 'producto' AND p.estado != 'cancelado' ${filtro.replace(/creado_en/g, 'p.creado_en')}
         GROUP BY pi.producto_id, pi.nombre_producto
         ORDER BY total_vendido DESC
         LIMIT ${limiteSeguro}`
    );
    return rows;
};

export const ventasPorMes = async (pool, meses = 6, rango = 'todos') => {
    const filtro = obtenerFiltroFecha(rango);
    const formatoFecha = rango === 'todos' ? '%Y-%m' : '%Y-%m-%d';
    const alias = rango === 'todos' ? 'mes' : 'dia';

    const [filas] = await pool.query(
        `SELECT
            DATE_FORMAT(p.creado_en, '${formatoFecha}') AS ${alias},
            COUNT(DISTINCT p.id) AS cantidad_pedidos,
            COALESCE(SUM(pi.subtotal), 0) AS total
         FROM pedidos p
         INNER JOIN pedido_items pi ON pi.pedido_id = p.id
         WHERE p.tipo = 'producto' AND p.estado != 'cancelado' ${filtro.replace(/creado_en/g, 'p.creado_en')}
         GROUP BY ${alias}
         ORDER BY ${alias} ASC`
    );

    if (rango === 'todos') {
        const mapa = {};
        filas.forEach((f) => {
            mapa[f.mes] = {
                cantidad_pedidos: f.cantidad_pedidos,
                total: Number(Number(f.total).toFixed(2)),
            };
        });

        const resultado = [];
        const hoy = new Date();
        for (let i = meses - 1; i >= 0; i--) {
            const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
            const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
            const dato = mapa[clave] || { cantidad_pedidos: 0, total: 0 };
            resultado.push({
                fecha: clave,
                cantidad_pedidos: dato.cantidad_pedidos,
                total: dato.total,
            });
        }
        return resultado;
    }

    return filas.map((f) => ({
        fecha: f.dia,
        cantidad_pedidos: f.cantidad_pedidos,
        total: Number(Number(f.total).toFixed(2)),
    }));
};
