import * as estadisticasModel from '../models/estadisticas.model.js';

// reúne las estadísticas del panel para el período solicitado
export const obtenerEstadisticas = async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const rango = req.query.rango || 'todos';

        const [pedidosPorEstado, productosMasVendidos, ventasPorMes] = await Promise.all([
            estadisticasModel.pedidosPorEstado(pool, rango),
            estadisticasModel.productosMasVendidos(pool, 10, rango),
            estadisticasModel.ventasPorMes(pool, 6, rango),
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
};
