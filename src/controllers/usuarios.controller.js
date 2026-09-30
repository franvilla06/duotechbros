const authService = require('../services/auth.service');
const usuariosModel = require('../models/usuarios.model');

// VALIDACIONES

// validar el formato del nombre de usuario
function validarUsuario(usuario) {
    if (!usuario) return 'El nombre de usuario es obligatorio.';
    if (usuario.length < 3) return 'El nombre de usuario debe tener al menos 3 caracteres.';
    if (usuario.length > 30) return 'El nombre de usuario no puede superar los 30 caracteres.';
    if (!/^[a-zA-Z0-9_]+$/.test(usuario)) {
        return 'El nombre de usuario solo puede contener letras, numeros y guion bajo.';
    }
    return null;
}

// validar el formato de la contrasenia
function validarPassword(password) {
    if (!password) return 'La contrasenia es obligatoria.';
    if (password.length < 6) return 'La contrasenia debe tener al menos 6 caracteres.';
    return null;
}

// REGISTRO Y LOGIN

// registrar un nuevo usuario
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

// iniciar sesion de un usuario existente
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

// obtener el perfil del usuario autenticado
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

// cambiar la contrasenia del usuario
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

// dar de baja la cuenta del usuario
function darDeBajaUsuario(req, res) {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({
            success: false,
            error: 'Ingresa tu contrasenia para confirmar.',
        });
    }

    try {
        // verificar contrasenia antes de eliminar
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

module.exports = {
    registrar,
    iniciarSesion,
    obtenerPerfil,
    cambiarPassword,
    darDeBajaUsuario,
};