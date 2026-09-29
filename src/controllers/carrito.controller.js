// controlador del carrito de compras
// todas las funciones asumen que el usuario esta autenticado
// el middleware requiereAuthUsuario agrega req.usuario (nombre de usuario)

// FUNCIONES AUXILIARES

// obtener el id del usuario a partir del nombre de usuario
function obtenerUsuarioId(db, nombreUsuario) {
    const user = db.prepare('SELECT id FROM usuarios WHERE usuario = ?').get(nombreUsuario);
    return user ? user.id : null;
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
        const producto = db.prepare('SELECT id, stock FROM productos WHERE id = ?').get(producto_id);
        if (!producto) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado.' });
        }
        if (Number(producto.stock) <= 0) {
            return res.status(400).json({ success: false, error: 'El producto no tiene stock disponible.' });
        }

        // verificar si el producto ya esta en el carrito
        const existente = db
            .prepare('SELECT id, cantidad FROM carrito WHERE usuario_id = ? AND producto_id = ?')
            .get(usuarioId, producto_id);

        if (existente) {
            // sumar cantidades
            const nuevaCantidad = existente.cantidad + cantidadFinal;
            db.prepare('UPDATE carrito SET cantidad = ? WHERE id = ?').run(nuevaCantidad, existente.id);
            return res.json({
                success: true,
                message: 'Cantidad actualizada en el carrito.',
                id: existente.id,
                cantidad: nuevaCantidad,
            });
        }

        // insertar un nuevo item
        const info = db
            .prepare('INSERT INTO carrito (usuario_id, producto_id, cantidad) VALUES (?, ?, ?)')
            .run(usuarioId, producto_id, cantidadFinal);

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

// devuelve todos los items del carrito del usuario con datos del producto
// incluye un resumen con la cantidad total y el precio total
function listarCarrito(req, res) {
    try {
        const db = req.app.locals.db;

        const usuarioId = obtenerUsuarioId(db, req.usuario);
        if (!usuarioId) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
        }

        const items = db
            .prepare(
                `
            SELECT
                c.id,
                c.cantidad,
                c.agregado_en,
                p.id AS producto_id,
                p.nombre,
                p.descripcion,
                p.precio,
                p.imagen_url,
                p.categoria,
                p.stock
            FROM carrito c
            INNER JOIN productos p ON p.id = c.producto_id
            WHERE c.usuario_id = ?
            ORDER BY c.agregado_en DESC
        `
            )
            .all(usuarioId);

        // calcular subtotales por item
        const itemsConSubtotal = items.map((item) => ({
            ...item,
            subtotal: Number((Number(item.precio) * item.cantidad).toFixed(2)),
        }));

        // calcular resumen general
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

// cambia la cantidad de un item del carrito
// si la cantidad es 0, elimina el item
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

        // verificar que el item pertenezca al carrito de este usuario
        const item = db
            .prepare('SELECT id FROM carrito WHERE id = ? AND usuario_id = ?')
            .get(id, usuarioId);
        if (!item) {
            return res.status(404).json({ success: false, error: 'Item no encontrado en tu carrito.' });
        }

        if (cantidadFinal === 0) {
            db.prepare('DELETE FROM carrito WHERE id = ?').run(id);
            return res.json({ success: true, message: 'Item eliminado del carrito.', eliminado: true });
        }

        db.prepare('UPDATE carrito SET cantidad = ? WHERE id = ?').run(cantidadFinal, id);
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

        const info = db
            .prepare('DELETE FROM carrito WHERE id = ? AND usuario_id = ?')
            .run(id, usuarioId);

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

        const info = db.prepare('DELETE FROM carrito WHERE usuario_id = ?').run(usuarioId);

        return res.json({
            success: true,
            message: 'Carrito vaciado.',
            items_eliminados: info.changes,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    agregarAlCarrito,
    listarCarrito,
    cambiarCantidad,
    eliminarItem,
    vaciarCarrito,
};