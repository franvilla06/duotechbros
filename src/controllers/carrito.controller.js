// controlador del carrito de compras
// todas las funciones asumen que el usuario esta autenticado
// el middleware requiereAuthUsuario agrega req.usuario (nombre de usuario)

const carritoModel = require('../models/carrito.model');
const carritoService = require('../services/carrito.service');

// FUNCIONES AUXILIARES

// obtener el id del usuario a partir del nombre de usuario
function obtenerUsuarioId(db, nombreUsuario) {
    return carritoModel.obtenerUsuarioId(db, nombreUsuario);
}

// AGREGAR AL CARRITO

// agrega un producto al carrito
// si ya existe, suma la cantidad
function agregarAlCarrito(req, res) {
    const { producto_id, cantidad } = req.body;

    if (!producto_id) {
        return res.status(400).json({ success: false, error: 'Falta el id del producto.' });
    }

    const cantidadFinal = parseInt(cantidad) || 1;
    if (cantidadFinal < 1) {
        return res.status(400).json({ success: false, error: 'La cantidad debe ser al menos 1.' });
    }

    try {
        const db = req.app.locals.db;

        const usuarioId = obtenerUsuarioId(db, req.usuario);
        if (!usuarioId) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
        }

        // verificar que el producto exista y tenga stock
        const producto = carritoModel.obtenerProducto(db, producto_id);
        if (!producto) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado.' });
        }
        if (Number(producto.stock) <= 0) {
            return res.status(400).json({ success: false, error: 'El producto no tiene stock disponible.' });
        }

        // verificar si el producto ya esta en el carrito
        const existente = carritoModel.buscarItem(db, usuarioId, producto_id);

        if (existente) {
            const nuevaCantidad = existente.cantidad + cantidadFinal;
            carritoModel.actualizarCantidad(db, existente.id, nuevaCantidad);
            return res.json({
                success: true,
                message: 'Cantidad actualizada en el carrito.',
                id: existente.id,
                cantidad: nuevaCantidad,
            });
        }

        const info = carritoModel.insertarItem(db, usuarioId, producto_id, cantidadFinal);

        return res.json({
            success: true,
            message: 'Producto agregado al carrito.',
            id: info.lastInsertRowid,
            cantidad: cantidadFinal,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

// LISTAR EL CARRITO

function listarCarrito(req, res) {
    try {
        const db = req.app.locals.db;

        const usuarioId = obtenerUsuarioId(db, req.usuario);
        if (!usuarioId) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
        }

        const items = carritoModel.listarItems(db, usuarioId);

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
}

// CAMBIAR CANTIDAD DE UN ITEM

function cambiarCantidad(req, res) {
    const { id } = req.params;
    const { cantidad } = req.body;

    const cantidadFinal = parseInt(cantidad);
    if (isNaN(cantidadFinal) || cantidadFinal < 0) {
        return res.status(400).json({ success: false, error: 'Cantidad invalida.' });
    }

    try {
        const db = req.app.locals.db;

        const usuarioId = obtenerUsuarioId(db, req.usuario);
        if (!usuarioId) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
        }

        const item = carritoModel.buscarItemDeUsuario(db, id, usuarioId);
        if (!item) {
            return res.status(404).json({ success: false, error: 'Item no encontrado en tu carrito.' });
        }

        if (cantidadFinal === 0) {
            carritoModel.eliminarItem(db, id);
            return res.json({ success: true, message: 'Item eliminado del carrito.', eliminado: true });
        }

        carritoModel.actualizarCantidad(db, id, cantidadFinal);
        return res.json({ success: true, message: 'Cantidad actualizada.', cantidad: cantidadFinal });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

// ELIMINAR UN ITEM

function eliminarItem(req, res) {
    const { id } = req.params;

    try {
        const db = req.app.locals.db;

        const usuarioId = obtenerUsuarioId(db, req.usuario);
        if (!usuarioId) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
        }

        const info = carritoModel.eliminarItemDeUsuario(db, id, usuarioId);

        if (info.changes === 0) {
            return res.status(404).json({ success: false, error: 'Item no encontrado en tu carrito.' });
        }

        return res.json({ success: true, message: 'Item eliminado del carrito.' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

// VACIAR EL CARRITO

function vaciarCarrito(req, res) {
    try {
        const db = req.app.locals.db;

        const usuarioId = obtenerUsuarioId(db, req.usuario);
        if (!usuarioId) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
        }

        const info = carritoModel.vaciar(db, usuarioId);

        return res.json({
            success: true,
            message: 'Carrito vaciado.',
            items_eliminados: info.changes,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

// ENVIAR PEDIDO

// convierte el carrito en un pedido real
// esta operacion es atomica (transaccion): si algo falla, no se modifica nada
// pasos:
// 1. verificar que el carrito tenga items
// 2. verificar stock de cada producto
// 3. crear el registro en pedidos
// 4. guardar el detalle en pedido_items
// 5. descontar stock de cada producto
// 6. vaciar el carrito
function enviarPedido(req, res) {
    try {
        const db = req.app.locals.db;
        const resultado = carritoService.enviarPedido(db, req.usuario);
        return res.status(resultado.status).json(resultado.body);
    } catch (error) {
        console.error('Error al enviar pedido:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    agregarAlCarrito,
    listarCarrito,
    cambiarCantidad,
    eliminarItem,
    vaciarCarrito,
    enviarPedido,
};