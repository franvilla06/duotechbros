const carritoModel = require('../models/carrito.model');
const pedidosModel = require('../models/pedidos.model');
const productosModel = require('../models/productos.model');

// ENVIAR PEDIDO
// convierte el carrito en un pedido real de forma atomica

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

// REPETIR PEDIDO
// copia los items de una compra anterior al carrito actual
// suma cantidades si el producto ya esta en el carrito
// respeta el stock disponible y omite productos eliminados o sin stock

function repetirPedido(db, nombreUsuario, pedidoId) {
    const usuarioId = carritoModel.obtenerUsuarioId(db, nombreUsuario);
    if (!usuarioId) {
        return { status: 404, body: { success: false, error: 'Usuario no encontrado.' } };
    }

    // verificar que el pedido pertenezca al usuario
    const pedido = db
        .prepare('SELECT id, tipo, estado FROM pedidos WHERE id = ? AND usuario_id = ?')
        .get(pedidoId, usuarioId);

    if (!pedido) {
        return { status: 404, body: { success: false, error: 'Pedido no encontrado.' } };
    }

    if (pedido.tipo !== 'producto') {
        return {
            status: 400,
            body: { success: false, error: 'Solo se pueden repetir compras de la tienda.' },
        };
    }

    const estadoActual = (pedido.estado || 'pendiente').toLowerCase().trim();
    if (estadoActual === 'cancelado') {
        return {
            status: 400,
            body: { success: false, error: 'No se puede repetir un pedido cancelado.' },
        };
    }

    const items = pedidosModel.listarItemsDePedido(db, pedidoId);
    if (items.length === 0) {
        return {
            status: 400,
            body: { success: false, error: 'El pedido no tiene items para repetir.' },
        };
    }

    const agregados = [];
    const omitidos = [];

    const ejecutar = db.transaction(() => {
        for (const item of items) {
            // verificar que el producto siga existiendo
            const producto = carritoModel.obtenerProductoConNombre(db, item.producto_id);
            if (!producto) {
                omitidos.push(`${item.nombre_producto} (ya no disponible)`);
                continue;
            }

            if (Number(producto.stock) <= 0) {
                omitidos.push(`${producto.nombre} (sin stock)`);
                continue;
            }

            const stockDisponible = Number(producto.stock);

            // verificar si ya esta en el carrito
            const existente = carritoModel.buscarItem(db, usuarioId, item.producto_id);

            if (existente) {
                // sumar cantidad, capada al stock disponible
                const nuevaCantidad = Math.min(existente.cantidad + item.cantidad, stockDisponible);
                if (nuevaCantidad > existente.cantidad) {
                    carritoModel.actualizarCantidad(db, existente.id, nuevaCantidad);
                    agregados.push(`${nuevaCantidad - existente.cantidad}x ${producto.nombre}`);
                } else {
                    omitidos.push(`${producto.nombre} (ya tenes el maximo disponible en el carrito)`);
                }
            } else {
                // crear item nuevo, capado al stock
                const cantidadFinal = Math.min(item.cantidad, stockDisponible);
                carritoModel.insertarItem(db, usuarioId, item.producto_id, cantidadFinal);
                agregados.push(`${cantidadFinal}x ${producto.nombre}`);
            }
        }
    });

    ejecutar();

    if (agregados.length === 0) {
        return {
            status: 400,
            body: {
                success: false,
                error: 'No se pudo agregar ningun producto (sin stock o ya no disponibles).',
                omitidos,
            },
        };
    }

    return {
        status: 200,
        body: {
            success: true,
            message: 'Productos agregados al carrito.',
            agregados: agregados.length,
            detalle_agregados: agregados,
            omitidos,
        },
    };
}

module.exports = { enviarPedido, repetirPedido };