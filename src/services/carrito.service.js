const carritoModel = require('../models/carrito.model');
const pedidosModel = require('../models/pedidos.model');
const productosModel = require('../models/productos.model');

function enviarPedido(db, nombreUsuario) {
    const usuarioId = carritoModel.obtenerUsuarioId(db, nombreUsuario);
    if (!usuarioId) {
        return {
            status: 404,
            body: { success: false, error: 'Usuario no encontrado.' },
        };
    }

    const items = carritoModel.listarItemsParaPedido(db, usuarioId);
    if (items.length === 0) {
        return {
            status: 400,
            body: { success: false, error: 'El carrito esta vacio.' },
        };
    }

    const sinStock = [];
    for (const item of items) {
        if (item.cantidad > Number(item.stock)) {
            sinStock.push(`${item.nombre} (disponible: ${item.stock}, pedido: ${item.cantidad})`);
        }
    }

    if (sinStock.length > 0) {
        return {
            status: 400,
            body: {
                success: false,
                error: 'Algunos productos no tienen stock suficiente.',
                detalle: sinStock,
            },
        };
    }

    const totalPrecio = items.reduce((acc, item) => acc + Number(item.precio) * item.cantidad, 0);
    const totalUnidades = items.reduce((acc, item) => acc + item.cantidad, 0);
    const resumenNotas = items.map((item) => `${item.cantidad}x ${item.nombre}`).join(', ');

    const ejecutarPedido = db.transaction(() => {
        const infoPedido = pedidosModel.crearPedidoDeUsuario(db, {
            nombre_cliente: nombreUsuario,
            telefono: 'pendiente',
            email: 'pendiente',
            modelo_celular: 'Compra de accesorios',
            descripcion_problema: `Pedido de ${items.length} producto(s) desde el carrito`,
            usuario_id: usuarioId,
            notas: resumenNotas,
        });

        const pedidoId = infoPedido.lastInsertRowid;

        for (const item of items) {
            const subtotal = Number((Number(item.precio) * item.cantidad).toFixed(2));
            pedidosModel.insertarItem(db, {
                pedido_id: pedidoId,
                producto_id: item.producto_id,
                nombre_producto: item.nombre,
                precio_unitario: item.precio,
                cantidad: item.cantidad,
                subtotal,
            });
        }

        for (const item of items) {
            productosModel.descontarStock(db, item.producto_id, item.cantidad);
        }

        carritoModel.vaciar(db, usuarioId);

        return { pedidoId, totalPrecio, totalUnidades };
    });

    const resultado = ejecutarPedido();
    return {
        status: 200,
        body: {
            success: true,
            message: 'Pedido enviado correctamente.',
            pedido_id: resultado.pedidoId,
            total: Number(resultado.totalPrecio.toFixed(2)),
            unidades: resultado.totalUnidades,
        },
    };
}

module.exports = { enviarPedido };
