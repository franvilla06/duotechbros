const estadisticasModel = require('../models/estadisticas.model');

// devuelve todas las estadisticas que usa el dashboard
// en una sola peticion para que el frontend no tenga que hacer varias
function obtenerEstadisticas(req, res) {
    try {
        const db = req.app.locals.db;

        return res.json({
            success: true,
            pedidos_por_estado: estadisticasModel.pedidosPorEstado(db),
            productos_mas_vendidos: estadisticasModel.productosMasVendidos(db, 10),
            ventas_por_mes: estadisticasModel.ventasPorMes(db, 6),
        });
    } catch (error) {
        console.error('Error al obtener estadisticas:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = { obtenerEstadisticas };