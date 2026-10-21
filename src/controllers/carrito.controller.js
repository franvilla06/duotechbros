import * as carritoModel from '../models/carrito.model.js';
import * as carritoService from '../services/carrito.service.js';

const obtenerUsuarioId = (pool, nombreUsuario) => {
    return carritoModel.obtenerUsuarioId(pool, nombreUsuario);
};

// AGREGAR AL CARRITO

export const agregarAlCarrito = async (req, res) => {
    const { producto_id, cantidad } = req.body;

    if (!producto_id) {
        return res.status(400).json({ success: false, error: 'Falta el id del producto.' });
    }

    const cantidadFinal = parseInt(cantidad) || 1;
    if (cantidadFinal < 1) {
        return res.status(400).json({ success: false, error: 'La cantidad debe ser al menos 1.' });
    }

    try {
        const pool = req.app.locals.pool;

        const usuarioId = await obtenerUsuarioId(pool, req.usuario);
        if (!usuarioId) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
        }

        const producto = await carritoModel.obtenerProducto(pool, producto_id);
        if (!producto) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado.' });
        }
        if (Number(producto.stock) <= 0) {
            return res
                .status(400)
                .json({ success: false, error: 'El producto no tiene stock disponible.' });
        }

        const existente = await carritoModel.buscarItem(pool, usuarioId, producto_id);

        if (existente) {
            const nuevaCantidad = existente.cantidad + cantidadFinal;
            await carritoModel.actualizarCantidad(pool, existente.id, nuevaCantidad);
            return res.json({
                success: true,
                message: 'Cantidad actualizada en el carrito.',
                id: existente.id,
                cantidad: nuevaCantidad,
            });
        }

        const info = await carritoModel.insertarItem(pool, usuarioId, producto_id, cantidadFinal);

        return res.json({
            success: true,
            message: 'Producto agregado al carrito.',
            id: info.insertId,
            cantidad: cantidadFinal,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// LISTAR EL CARRITO

export const listarCarrito = async (req, res) => {
    try {
        const pool = req.app.locals.pool;

        const usuarioId = await obtenerUsuarioId(pool, req.usuario);
        if (!usuarioId) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
        }

        const items = await carritoModel.listarItems(pool, usuarioId);

        const itemsConSubtotal = items.map((item) => ({
            ...item,
            subtotal: Number((Number(item.precio) * item.cantidad).toFixed(2)),
        }));

        const totalUnidades = itemsConSubtotal.reduce((acc, item) => acc + item.cantidad, 0);
        const totalPrecio = itemsConSubtotal.reduce((acc, item) => acc + item.subtotal, 0);

        return res.json({
            success: true,
            items: itemsConSubtotal,
            resumen: {
                total_items: itemsConSubtotal.length,
                total_unidades: totalUnidades,
                total_precio: Number(totalPrecio.toFixed(2)),
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// CAMBIAR CANTIDAD

export const cambiarCantidad = async (req, res) => {
    const { id } = req.params;
    const { cantidad } = req.body;

    const cantidadFinal = parseInt(cantidad);
    if (isNaN(cantidadFinal) || cantidadFinal < 0) {
        return res.status(400).json({ success: false, error: 'Cantidad invalida.' });
    }

    try {
        const pool = req.app.locals.pool;

        const usuarioId = await obtenerUsuarioId(pool, req.usuario);
        if (!usuarioId) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
        }

        const item = await carritoModel.buscarItemDeUsuario(pool, id, usuarioId);
        if (!item) {
            return res
                .status(404)
                .json({ success: false, error: 'Item no encontrado en tu carrito.' });
        }

        if (cantidadFinal === 0) {
            await carritoModel.eliminarItem(pool, id);
            return res.json({
                success: true,
                message: 'Item eliminado del carrito.',
                eliminado: true,
            });
        }

        await carritoModel.actualizarCantidad(pool, id, cantidadFinal);
        return res.json({ success: true, message: 'Cantidad actualizada.', cantidad: cantidadFinal });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// ELIMINAR ITEM

export const eliminarItem = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = req.app.locals.pool;

        const usuarioId = await obtenerUsuarioId(pool, req.usuario);
        if (!usuarioId) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
        }

        const info = await carritoModel.eliminarItemDeUsuario(pool, id, usuarioId);

        if (info.affectedRows === 0) {
            return res
                .status(404)
                .json({ success: false, error: 'Item no encontrado en tu carrito.' });
        }

        return res.json({ success: true, message: 'Item eliminado del carrito.' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// VACIAR CARRITO

export const vaciarCarrito = async (req, res) => {
    try {
        const pool = req.app.locals.pool;

        const usuarioId = await obtenerUsuarioId(pool, req.usuario);
        if (!usuarioId) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
        }

        const info = await carritoModel.vaciar(pool, usuarioId);

        return res.json({
            success: true,
            message: 'Carrito vaciado.',
            items_eliminados: info.affectedRows,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// ENVIAR PEDIDO

export const enviarPedido = async (req, res) => {
    try {
        const resultado = await carritoService.enviarPedido(req.app.locals.pool, req.usuario);
        return res.status(resultado.status).json(resultado.body);
    } catch (error) {
        console.error('Error al enviar pedido:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};
