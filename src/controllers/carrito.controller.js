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
            const nuevaCantidad = existente.cantidad + cantidadFinal;
            db.prepare('UPDATE carrito SET cantidad = ? WHERE id = ?').run(nuevaCantidad, existente.id);
            return res.json({
                success: true,
                message: 'Cantidad actualizada en el carrito.',
                id: existente.id,
                cantidad: nuevaCantidad,
            });
        }

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

        const usuarioId = obtenerUsuarioId(db, req.usuario);
        if (!usuarioId) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
        }

        // obtener los items del carrito con datos actualizados del producto
        const items = db
            .prepare(
                `
            SELECT
                c.id,
                c.cantidad,
                p.id AS producto_id,
                p.nombre,
                p.precio,
                p.stock
            FROM carrito c
            INNER JOIN productos p ON p.id = c.producto_id
            WHERE c.usuario_id = ?
        `
            )
            .all(usuarioId);

        if (items.length === 0) {
            return res.status(400).json({ success: false, error: 'El carrito esta vacio.' });
        }

        // verificar stock de todos los productos antes de continuar
        const sinStock = [];
        for (const item of items) {
            if (item.cantidad > Number(item.stock)) {
                sinStock.push(`${item.nombre} (disponible: ${item.stock}, pedido: ${item.cantidad})`);
            }
        }

        if (sinStock.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Algunos productos no tienen stock suficiente.',
                detalle: sinStock,
            });
        }

        // calcular total y armar el resumen de items para las notas
        const totalPrecio = items.reduce(
            (acc, item) => acc + Number(item.precio) * item.cantidad,
            0
        );
        const totalUnidades = items.reduce((acc, item) => acc + item.cantidad, 0);
        const resumenNotas = items
            .map((item) => `${item.cantidad}x ${item.nombre}`)
            .join(', ');

        // transaccion atomica
        const ejecutarPedido = db.transaction(() => {
            // 1. crear el pedido
            const insertPedido = db.prepare(`
                INSERT INTO pedidos (
                    nombre_cliente,
                    telefono,
                    email,
                    modelo_celular,
                    descripcion_problema,
                    estado,
                    usuario_id,
                    tipo,
                    notas
                )
                VALUES (?, ?, ?, ?, ?, 'pendiente', ?, 'producto', ?)
            `);

            const infoPedido = insertPedido.run(
                req.usuario,
                'pendiente',
                'pendiente',
                'Compra de accesorios',
                `Pedido de ${items.length} producto(s) desde el carrito`,
                usuarioId,
                resumenNotas
            );

            const pedidoId = infoPedido.lastInsertRowid;

            // 2. guardar cada item del pedido
            const insertItem = db.prepare(`
                INSERT INTO pedido_items (
                    pedido_id,
                    producto_id,
                    nombre_producto,
                    precio_unitario,
                    cantidad,
                    subtotal
                )
                VALUES (?, ?, ?, ?, ?, ?)
            `);

            for (const item of items) {
                const subtotal = Number((Number(item.precio) * item.cantidad).toFixed(2));
                insertItem.run(
                    pedidoId,
                    item.producto_id,
                    item.nombre,
                    item.precio,
                    item.cantidad,
                    subtotal
                );
            }

            // 3. descontar stock de cada producto
            const updateStock = db.prepare('UPDATE productos SET stock = stock - ? WHERE id = ?');
            for (const item of items) {
                updateStock.run(item.cantidad, item.producto_id);
            }

            // 4. vaciar el carrito
            db.prepare('DELETE FROM carrito WHERE usuario_id = ?').run(usuarioId);

            return { pedidoId, totalPrecio, totalUnidades };
        });

        const resultado = ejecutarPedido();

        return res.json({
            success: true,
            message: 'Pedido enviado correctamente.',
            pedido_id: resultado.pedidoId,
            total: Number(resultado.totalPrecio.toFixed(2)),
            unidades: resultado.totalUnidades,
        });
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