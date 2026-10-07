async function pedidosPorEstado(pool) {
    const [rows] = await pool.query(
        `SELECT tipo, estado, COUNT(*) AS total
         FROM pedidos
         GROUP BY tipo, estado`
    );
    return rows;
}

async function productosMasVendidos(pool, limite = 10) {
    const [rows] = await pool.query(
        `SELECT
            pi.producto_id,
            pi.nombre_producto,
            SUM(pi.cantidad) AS total_vendido,
            SUM(pi.subtotal) AS total_recaudado
         FROM pedido_items pi
         INNER JOIN pedidos p ON p.id = pi.pedido_id
         WHERE p.tipo = 'producto' AND p.estado != 'cancelado'
         GROUP BY pi.producto_id, pi.nombre_producto
         ORDER BY total_vendido DESC
         LIMIT ?`,
        [String(limite)]
    );
    return rows;
}

async function ventasPorMes(pool, meses = 6) {
    const [filas] = await pool.query(
        `SELECT
            DATE_FORMAT(p.creado_en, '%Y-%m') AS mes,
            COUNT(DISTINCT p.id) AS cantidad_pedidos,
            COALESCE(SUM(pi.subtotal), 0) AS total
         FROM pedidos p
         INNER JOIN pedido_items pi ON pi.pedido_id = p.id
         WHERE p.tipo = 'producto' AND p.estado != 'cancelado'
         GROUP BY mes`
    );

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
            mes: clave,
            cantidad_pedidos: dato.cantidad_pedidos,
            total: dato.total,
        });
    }

    return resultado;
}

module.exports = { pedidosPorEstado, productosMasVendidos, ventasPorMes };