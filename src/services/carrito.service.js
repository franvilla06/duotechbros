const carritoModel = require('../models/carrito.model');
const pedidosModel = require('../models/pedidos.model');
const productosModel = require('../models/productos.model');

// ENVIAR PEDIDO

async function enviarPedido(pool, nombreUsuario) {
    const usuarioId = await carritoModel.obtenerUsuarioId(pool, nombreUsuario);
    if (!usuarioId) {
        return {
            status: 404,
            body: { success: false, error: 'Usuario no encontrado.' },
        };
    }

    const items = await carritoModel.listarItemsParaPedido(pool, usuarioId);
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

    // transaccion
    const conexion = await pool.getConnection();
    try {
        await conexion.beginTransaction();

        // 1. crear el pedido
        const [pedidoResult] = await conexion.query(
            `INSERT INTO pedidos (
                nombre_cliente, telefono, email, modelo_celular, descripcion_problema,
                estado, usuario_id, tipo, notas
             )
             VALUES (?, ?, ?, ?, ?, 'pendiente', ?, 'producto', ?)`,
            [
                nombreUsuario,
                'pendiente',
                'pendiente',
                'Compra de accesorios',
                `Pedido de ${items.length} producto(s) desde el carrito`,
                usuarioId,
                resumenNotas,
            ]
        );

        const pedidoId = pedidoResult.insertId;

        // 2. guardar items
        for (const item of items) {
            const subtotal = Number((Number(item.precio) * item.cantidad).toFixed(2));
            await conexion.query(
                `INSERT INTO pedido_items (pedido_id, producto_id, nombre_producto, precio_unitario, cantidad, subtotal)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [pedidoId, item.producto_id, item.nombre, item.precio, item.cantidad, subtotal]
            );
        }

        // 3. descontar stock
        for (const item of items) {
            await conexion.query('UPDATE productos SET stock = stock - ? WHERE id = ?', [
                item.cantidad,
                item.producto_id,
            ]);
        }

        // 4. vaciar carrito
        await conexion.query('DELETE FROM carrito WHERE usuario_id = ?', [usuarioId]);

        await conexion.commit();

        return {
            status: 200,
            body: {
                success: true,
                message: 'Pedido enviado correctamente.',
                pedido_id: pedidoId,
                total: Number(totalPrecio.toFixed(2)),
                unidades: totalUnidades,
            },
        };
    } catch (error) {
        await conexion.rollback();
        throw error;
    } finally {
        conexion.release();
    }
}

// REPETIR PEDIDO

async function repetirPedido(pool, nombreUsuario, pedidoId) {
    const usuarioId = await carritoModel.obtenerUsuarioId(pool, nombreUsuario);
    if (!usuarioId) {
        return { status: 404, body: { success: false, error: 'Usuario no encontrado.' } };
    }

    const [pedidoRows] = await pool.query(
        'SELECT id, tipo, estado FROM pedidos WHERE id = ? AND usuario_id = ?',
        [pedidoId, usuarioId]
    );
    const pedido = pedidoRows[0];

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

    const items = await pedidosModel.listarItemsDePedido(pool, pedidoId);
    if (items.length === 0) {
        return {
            status: 400,
            body: { success: false, error: 'El pedido no tiene items para repetir.' },
        };
    }

    const agregados = [];
    const omitidos = [];

    const conexion = await pool.getConnection();
    try {
        await conexion.beginTransaction();

        for (const item of items) {
            const producto = await carritoModel.obtenerProductoConNombre(pool, item.producto_id);
            if (!producto) {
                omitidos.push(`${item.nombre_producto} (ya no disponible)`);
                continue;
            }

            if (Number(producto.stock) <= 0) {
                omitidos.push(`${producto.nombre} (sin stock)`);
                continue;
            }

            const stockDisponible = Number(producto.stock);
            const existente = await carritoModel.buscarItem(pool, usuarioId, item.producto_id);

            if (existente) {
                const nuevaCantidad = Math.min(existente.cantidad + item.cantidad, stockDisponible);
                if (nuevaCantidad > existente.cantidad) {
                    await conexion.query('UPDATE carrito SET cantidad = ? WHERE id = ?', [
                        nuevaCantidad,
                        existente.id,
                    ]);
                    agregados.push(`${nuevaCantidad - existente.cantidad}x ${producto.nombre}`);
                } else {
                    omitidos.push(`${producto.nombre} (ya tenes el maximo disponible en el carrito)`);
                }
            } else {
                const cantidadFinal = Math.min(item.cantidad, stockDisponible);
                await conexion.query(
                    'INSERT INTO carrito (usuario_id, producto_id, cantidad) VALUES (?, ?, ?)',
                    [usuarioId, item.producto_id, cantidadFinal]
                );
                agregados.push(`${cantidadFinal}x ${producto.nombre}`);
            }
        }

        await conexion.commit();
    } catch (error) {
        await conexion.rollback();
        throw error;
    } finally {
        conexion.release();
    }

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