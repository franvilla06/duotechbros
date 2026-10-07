const bcrypt = require('bcryptjs');
const adminModel = require('../models/admin.model');
const productosModel = require('../models/productos.model');
const portafolioModel = require('../models/portafolio.model');
const pedidosModel = require('../models/pedidos.model');
const { generarToken } = require('../utils/token.util');

// PRODUCTOS

async function crearProducto(req, res) {
    const { nombre, descripcion, precio, imagen_url, categoria, stock } = req.body;

    if (!nombre || precio === undefined) {
        return res
            .status(400)
            .json({ success: false, error: 'Faltan campos obligatorios (nombre, precio)' });
    }

    try {
        const info = await productosModel.crear(req.app.locals.pool, {
            nombre,
            descripcion: descripcion || null,
            precio,
            imagen_url: imagen_url || null,
            categoria: categoria || null,
            stock: stock || 0,
        });
        return res.json({ success: true, id: info.insertId });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function actualizarProducto(req, res) {
    const { id } = req.params;
    const { nombre, descripcion, precio, imagen_url, categoria, stock } = req.body;

    if (!nombre || precio === undefined) {
        return res
            .status(400)
            .json({ success: false, error: 'Faltan campos obligatorios (nombre, precio)' });
    }

    try {
        const info = await productosModel.actualizar(req.app.locals.pool, id, {
            nombre,
            descripcion: descripcion || null,
            precio,
            imagen_url: imagen_url || null,
            categoria: categoria || null,
            stock: stock || 0,
        });

        if (info.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado' });
        }

        return res.json({ success: true, message: 'Producto actualizado' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function eliminarProducto(req, res) {
    const { id } = req.params;
    try {
        const info = await productosModel.eliminar(req.app.locals.pool, id);
        if (info.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado' });
        }
        return res.json({ success: true, message: 'Producto eliminado' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

// PORTAFOLIO

function normalizarFecha(valor) {
    if (valor === undefined || valor === null || valor === '') return null;
    const texto = String(valor).trim();
    if (texto === '') return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return null;
    return texto;
}

async function crearTrabajo(req, res) {
    const { titulo, descripcion, imagen_url, tipo_reparacion, fecha_inicio, fecha_fin } = req.body;

    if (!titulo) {
        return res.status(400).json({ success: false, error: 'El título es obligatorio' });
    }

    try {
        const info = await portafolioModel.crear(req.app.locals.pool, {
            titulo,
            descripcion: descripcion || null,
            imagen_url: imagen_url || null,
            tipo_reparacion: tipo_reparacion || null,
            fecha_inicio: normalizarFecha(fecha_inicio),
            fecha_fin: normalizarFecha(fecha_fin),
        });
        return res.json({ success: true, id: info.insertId });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function actualizarTrabajo(req, res) {
    const { id } = req.params;
    const { titulo, descripcion, imagen_url, tipo_reparacion, fecha_inicio, fecha_fin } = req.body;

    if (!titulo) {
        return res.status(400).json({ success: false, error: 'El título es obligatorio' });
    }

    try {
        const info = await portafolioModel.actualizar(req.app.locals.pool, id, {
            titulo,
            descripcion: descripcion || null,
            imagen_url: imagen_url || null,
            tipo_reparacion: tipo_reparacion || null,
            fecha_inicio: normalizarFecha(fecha_inicio),
            fecha_fin: normalizarFecha(fecha_fin),
        });

        if (info.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Trabajo no encontrado' });
        }

        return res.json({ success: true, message: 'Trabajo actualizado' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function eliminarTrabajo(req, res) {
    const { id } = req.params;
    try {
        const info = await portafolioModel.eliminar(req.app.locals.pool, id);
        if (info.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Trabajo no encontrado' });
        }
        return res.json({ success: true, message: 'Trabajo eliminado' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

// PEDIDOS

const ESTADOS_VALIDOS = ['pendiente', 'en proceso', 'completado', 'cancelado'];

async function actualizarEstadoPedido(req, res) {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
        return res.status(400).json({
            success: false,
            error: `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}`,
        });
    }

    try {
        const info = await pedidosModel.actualizarEstado(req.app.locals.pool, id, estado);

        if (info.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
        }

        return res.json({ success: true, message: 'Estado actualizado', estado });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function actualizarNotasPedido(req, res) {
    const { id } = req.params;
    const { notas } = req.body;

    let notasValor = null;
    if (notas !== undefined && notas !== null) {
        const texto = String(notas).trim();
        notasValor = texto === '' ? null : texto;
    }

    try {
        const info = await pedidosModel.actualizarNotas(req.app.locals.pool, id, notasValor);

        if (info.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
        }

        return res.json({ success: true, message: 'Notas actualizadas', notas: notasValor });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function actualizarPresupuestoPedido(req, res) {
    const { id } = req.params;
    const { presupuesto } = req.body;

    let presupuestoValor = null;

    if (presupuesto !== undefined && presupuesto !== null && presupuesto !== '') {
        const num = Number(presupuesto);
        if (isNaN(num) || num < 0) {
            return res.status(400).json({
                success: false,
                error: 'El presupuesto debe ser un numero mayor o igual a 0.',
            });
        }
        presupuestoValor = Number(num.toFixed(2));
    }

    try {
        const info = await pedidosModel.actualizarPresupuesto(
            req.app.locals.pool,
            id,
            presupuestoValor
        );

        if (info.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
        }

        return res.json({
            success: true,
            message: 'Presupuesto actualizado',
            presupuesto: presupuestoValor,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function eliminarPedido(req, res) {
    const { id } = req.params;
    try {
        const info = await pedidosModel.eliminar(req.app.locals.pool, id);
        if (info.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
        }
        return res.json({ success: true, message: 'Pedido eliminado' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

// PERFIL DEL ADMIN

async function cambiarUsuarioAdmin(req, res) {
    const usuarioNuevo = typeof req.body.usuario_nuevo === 'string'
        ? req.body.usuario_nuevo.trim()
        : '';
    const { password } = req.body;

    if (!usuarioNuevo || !password) {
        return res.status(400).json({ success: false, error: 'Completa todos los campos.' });
    }

    if (usuarioNuevo.length < 3 || usuarioNuevo.length > 30) {
        return res
            .status(400)
            .json({ success: false, error: 'El usuario debe tener entre 3 y 30 caracteres.' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(usuarioNuevo)) {
        return res.status(400).json({
            success: false,
            error: 'El usuario solo puede contener letras, numeros y guion bajo.',
        });
    }

    try {
        const pool = req.app.locals.pool;
        const admin = await adminModel.buscarPorUsuario(pool, req.usuario);
        if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
            return res.status(401).json({ success: false, error: 'Contrasenia incorrecta.' });
        }

        if (usuarioNuevo !== req.usuario) {
            const existe = await adminModel.contarPorUsuario(pool, usuarioNuevo);
            if (existe.count > 0) {
                return res
                    .status(409)
                    .json({ success: false, error: 'Ese nombre de usuario ya esta en uso.' });
            }
        }

        const resultado = await adminModel.actualizarUsuario(pool, req.usuario, usuarioNuevo);
        if (resultado.affectedRows === 0 && usuarioNuevo !== req.usuario) {
            return res.status(404).json({ success: false, error: 'Admin no encontrado.' });
        }

        return res.json({
            success: true,
            message: 'Usuario actualizado correctamente.',
            usuario: usuarioNuevo,
            token: generarToken('admin', usuarioNuevo),
        });
    } catch (error) {
        console.error('Error en cambiarUsuarioAdmin:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function cambiarPasswordAdmin(req, res) {
    const { password_actual, password_nueva, password_confirmar } = req.body;

    if (!password_actual || !password_nueva || !password_confirmar) {
        return res.status(400).json({ success: false, error: 'Completa todos los campos.' });
    }

    if (password_nueva.length < 6) {
        return res
            .status(400)
            .json({ success: false, error: 'La contrasenia debe tener al menos 6 caracteres.' });
    }

    if (password_nueva !== password_confirmar) {
        return res
            .status(400)
            .json({ success: false, error: 'Las contrasenias nuevas no coinciden.' });
    }

    if (password_nueva === password_actual) {
        return res.status(400).json({
            success: false,
            error: 'La nueva contrasenia debe ser distinta a la actual.',
        });
    }

    try {
        const pool = req.app.locals.pool;
        const admin = await adminModel.buscarPorUsuario(pool, req.usuario);
        if (!admin || !bcrypt.compareSync(password_actual, admin.password_hash)) {
            return res
                .status(401)
                .json({ success: false, error: 'Contrasenia actual incorrecta.' });
        }

        const nuevoHash = bcrypt.hashSync(password_nueva, 10);
        await adminModel.actualizarPassword(pool, req.usuario, nuevoHash);

        return res.json({ success: true, message: 'Contrasenia actualizada correctamente.' });
    } catch (error) {
        console.error('Error en cambiarPasswordAdmin:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function obtenerPerfilAdmin(req, res) {
    try {
        const admin = await adminModel.buscarPorUsuario(req.app.locals.pool, req.usuario);
        if (!admin) {
            return res.status(404).json({ success: false, error: 'Admin no encontrado.' });
        }
        return res.json({
            success: true,
            admin: {
                id: admin.id,
                usuario: admin.usuario,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    crearTrabajo,
    actualizarTrabajo,
    eliminarTrabajo,
    actualizarEstadoPedido,
    actualizarNotasPedido,
    actualizarPresupuestoPedido,
    eliminarPedido,
    cambiarUsuarioAdmin,
    cambiarPasswordAdmin,
    obtenerPerfilAdmin,
};