const authService = require('../services/auth.service');
const carritoService = require('../services/carrito.service');
const usuariosModel = require('../models/usuarios.model');
const pedidosModel = require('../models/pedidos.model');

// VALIDACIONES

function validarUsuario(usuario) {
    if (!usuario) return 'El nombre de usuario es obligatorio.';
    if (usuario.length < 3) return 'El nombre de usuario debe tener al menos 3 caracteres.';
    if (usuario.length > 30) return 'El nombre de usuario no puede superar los 30 caracteres.';
    if (!/^[a-zA-Z0-9_]+$/.test(usuario)) {
        return 'El nombre de usuario solo puede contener letras, numeros y guion bajo.';
    }
    return null;
}

function validarPassword(password) {
    if (!password) return 'La contrasenia es obligatoria.';
    if (password.length < 6) return 'La contrasenia debe tener al menos 6 caracteres.';
    return null;
}

// REGISTRO Y LOGIN

function registrar(req, res) {
    const { usuario, password } = req.body;

    const errorUsuario = validarUsuario(usuario);
    if (errorUsuario) {
        return res.status(400).json({ success: false, error: errorUsuario });
    }

    const errorPassword = validarPassword(password);
    if (errorPassword) {
        return res.status(400).json({ success: false, error: errorPassword });
    }

    try {
        const resultado = authService.registrarUsuario(req.app.locals.db, usuario, password);
        if (resultado.existe) {
            return res.status(409).json({
                success: false,
                error: 'Ese nombre de usuario ya esta en uso.',
            });
        }

        return res.json({
            success: true,
            message: 'Usuario registrado correctamente',
            usuario: usuario,
            id: resultado.id,
            token: resultado.token,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

function iniciarSesion(req, res) {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
        return res.status(400).json({
            success: false,
            error: 'Usuario y contrasenia son obligatorios.',
        });
    }

    try {
        const user = authService.autenticarUsuario(req.app.locals.db, usuario, password);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Usuario o contrasenia incorrectos.',
            });
        }

        return res.json({
            success: true,
            message: 'Login exitoso',
            usuario: user.usuario,
            id: user.id,
            token: user.token,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

// PERFIL

function obtenerPerfil(req, res) {
    try {
        const user = usuariosModel.obtenerPerfil(req.app.locals.db, req.usuario);
        if (!user) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
        }
        return res.json(user);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

function cambiarPassword(req, res) {
    const { password_actual, password_nueva, password_confirmar } = req.body;

    if (!password_actual || !password_nueva || !password_confirmar) {
        return res.status(400).json({
            success: false,
            error: 'Completa todos los campos.',
        });
    }

    if (password_nueva !== password_confirmar) {
        return res.status(400).json({
            success: false,
            error: 'Las contrasenias nuevas no coinciden.',
        });
    }

    const errorPassword = validarPassword(password_nueva);
    if (errorPassword) {
        return res.status(400).json({ success: false, error: errorPassword });
    }

    if (password_nueva === password_actual) {
        return res.status(400).json({
            success: false,
            error: 'La nueva contrasenia debe ser distinta a la actual.',
        });
    }

    try {
        const resultado = authService.cambiarPassword(
            req.app.locals.db,
            req.usuario,
            password_actual,
            password_nueva
        );

        if (resultado.error) {
            return res.status(400).json({ success: false, error: resultado.error });
        }

        return res.json({
            success: true,
            message: 'Contrasenia actualizada correctamente.',
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

function darDeBajaUsuario(req, res) {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({
            success: false,
            error: 'Ingresa tu contrasenia para confirmar.',
        });
    }

    try {
        const user = authService.autenticarUsuario(req.app.locals.db, req.usuario, password);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Contrasenia incorrecta.',
            });
        }

        const resultado = authService.darDeBaja(req.app.locals.db, req.usuario);
        if (resultado.error) {
            return res.status(400).json({ success: false, error: resultado.error });
        }

        return res.json({
            success: true,
            message: 'Cuenta eliminada correctamente.',
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

// HISTORIAL DE PEDIDOS DEL USUARIO

function listarMisPedidos(req, res) {
    try {
        const usuarioId = usuariosModel.obtenerId(req.app.locals.db, req.usuario);
        if (!usuarioId) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
        }

        const pedidos = pedidosModel.listarPorUsuario(req.app.locals.db, usuarioId);

        const pedidosNormalizados = pedidos.map((p) => ({
            ...p,
            total_precio: Number(Number(p.total_precio).toFixed(2)),
        }));

        return res.json({
            success: true,
            pedidos: pedidosNormalizados,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

function obtenerDetallePedido(req, res) {
    const { id } = req.params;

    try {
        const db = req.app.locals.db;

        const usuarioId = usuariosModel.obtenerId(db, req.usuario);
        if (!usuarioId) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
        }

        const pedido = pedidosModel.obtenerPedidoDeUsuario(db, id, usuarioId);
        if (!pedido) {
            return res.status(404).json({
                success: false,
                error: 'Pedido no encontrado o no pertenece a tu cuenta.',
            });
        }

        const items = pedidosModel.listarItemsDePedido(db, id);

        const itemsNormalizados = items.map((item) => ({
            ...item,
            precio_unitario: Number(Number(item.precio_unitario).toFixed(2)),
            subtotal: Number(Number(item.subtotal).toFixed(2)),
        }));

        const totalPrecio = itemsNormalizados.reduce((acc, item) => acc + item.subtotal, 0);
        const totalUnidades = itemsNormalizados.reduce((acc, item) => acc + item.cantidad, 0);

        return res.json({
            success: true,
            pedido: {
                id: pedido.id,
                tipo: pedido.tipo || 'reparacion',
                estado: pedido.estado,
                creado_en: pedido.creado_en,
                notas: pedido.notas,
                presupuesto: pedido.presupuesto,
                modelo_celular: pedido.modelo_celular,
                descripcion_problema: pedido.descripcion_problema,
                nombre_cliente: pedido.nombre_cliente,
                telefono: pedido.telefono,
                email: pedido.email,
                items: itemsNormalizados,
                total_items: itemsNormalizados.length,
                total_unidades: totalUnidades,
                total_precio: Number(totalPrecio.toFixed(2)),
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

// CANCELAR UN PEDIDO DEL USUARIO

function cancelarPedido(req, res) {
    const { id } = req.params;

    try {
        const db = req.app.locals.db;

        const usuarioId = usuariosModel.obtenerId(db, req.usuario);
        if (!usuarioId) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
        }

        const resultado = pedidosModel.cancelarPedidoDeUsuario(db, id, usuarioId);

        if (resultado.error) {
            return res.status(400).json({ success: false, error: resultado.error });
        }

        return res.json({
            success: true,
            message: 'Pedido cancelado correctamente.',
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

// REPETIR PEDIDO
// agrega los items de una compra anterior al carrito actual

function repetirPedido(req, res) {
    const { id } = req.params;

    try {
        const resultado = carritoService.repetirPedido(req.app.locals.db, req.usuario, id);
        return res.status(resultado.status).json(resultado.body);
    } catch (error) {
        console.error('Error al repetir pedido:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    registrar,
    iniciarSesion,
    obtenerPerfil,
    cambiarPassword,
    darDeBajaUsuario,
    listarMisPedidos,
    obtenerDetallePedido,
    cancelarPedido,
    repetirPedido,
};