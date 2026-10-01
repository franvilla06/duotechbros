// cuenta pedidos por tipo y estado
// devuelve un array con { tipo, estado, total }
function pedidosPorEstado(db) {
    return db
        .prepare(
            `
            SELECT tipo, estado, COUNT(*) AS total
            FROM pedidos
            GROUP BY tipo, estado
        `
        )
        .all();
}

// devuelve los productos mas vendidos (por unidades)
// excluye pedidos cancelados
function productosMasVendidos(db, limite = 10) {
    return db
        .prepare(
            `
            SELECT
                pi.producto_id,
                pi.nombre_producto,
                SUM(pi.cantidad) AS total_vendido,
                SUM(pi.subtotal) AS total_recaudado
            FROM pedido_items pi
            INNER JOIN pedidos p ON p.id = pi.pedido_id
            WHERE p.tipo = 'producto' AND p.estado != 'cancelado'
            GROUP BY pi.producto_id, pi.nombre_producto
            ORDER BY total_vendido DESC
            LIMIT ?
        `
        )
        .all(limite);
}

// devuelve las ventas agrupadas por mes
// solo cuenta compras (tipo producto) no canceladas
// se piden los ultimos N meses incluyendo el actual
function ventasPorMes(db, meses = 6) {
    // traemos todos los meses y despues rellenamos los vacios
    const filas = db
        .prepare(
            `
            SELECT
                strftime('%Y-%m', p.creado_en) AS mes,
                COUNT(DISTINCT p.id) AS cantidad_pedidos,
                COALESCE(SUM(pi.subtotal), 0) AS total
            FROM pedidos p
            INNER JOIN pedido_items pi ON pi.pedido_id = p.id
            WHERE p.tipo = 'producto' AND p.estado != 'cancelado'
            GROUP BY mes
        `
        )
        .all();

    // crear un mapa de mes -> datos
    const mapa = {};
    filas.forEach((f) => {
        mapa[f.mes] = {
            cantidad_pedidos: f.cantidad_pedidos,
            total: Number(Number(f.total).toFixed(2)),
        };
    });

    // generar los ultimos N meses (incluyendo el actual)
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