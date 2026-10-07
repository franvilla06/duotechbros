const estadisticasModel = require('../models/estadisticas.model');

async function obtenerEstadisticas(req, res) {
    try {
        const pool = req.app.locals.pool;

        const [pedidosPorEstado, productosMasVendidos, ventasPorMes] = await Promise.all([
            estadisticasModel.pedidosPorEstado(pool),
            estadisticasModel.productosMasVendidos(pool, 10),
            estadisticasModel.ventasPorMes(pool, 6),
        ]);

        return res.json({
            success: true,
            pedidos_por_estado: pedidosPorEstado,
            productos_mas_vendidos: productosMasVendidos,
            ventas_por_mes: ventasPorMes,
        });
    } catch (error) {
        console.error('Error al obtener estadisticas:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = { obtenerEstadisticas };