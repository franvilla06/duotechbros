const bcrypt = require('bcryptjs');
const { generarToken } = require('../middlewares/auth.middleware');

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
        // verificar si el usuario ya existe
        const existe = req.app.locals.db
            .prepare('SELECT COUNT(*) as count FROM usuarios WHERE usuario = ?')
            .get(usuario);
        if (existe.count > 0) {
            return res.status(409).json({
                success: false,
                error: 'Ese nombre de usuario ya esta en uso.',
            });
        }

        // hashear la contrasenia antes de guardarla
        const hash = bcrypt.hashSync(password, 10);

        // insertar el usuario en la base de datos
        const info = req.app.locals.db
            .prepare('INSERT INTO usuarios (usuario, password_hash) VALUES (?, ?)')
            .run(usuario, hash);

        // generar el token para dejarlo logueado automaticamente
        const token = generarToken('usuario', usuario);

        return res.json({
            success: true,
            message: 'Usuario registrado correctamente',
            usuario: usuario,
            id: info.lastInsertRowid,
            token: token,
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
        const user = req.app.locals.db
            .prepare('SELECT * FROM usuarios WHERE usuario = ?')
            .get(usuario);
        if (!user || !bcrypt.compareSync(password, user.password_hash)) {
            return res.status(401).json({
                success: false,
                error: 'Usuario o contrasenia incorrectos.',
            });
        }

        const token = generarToken('usuario', user.usuario);

        return res.json({
            success: true,
            message: 'Login exitoso',
            usuario: user.usuario,
            id: user.id,
            token: token,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

// PERFIL

// obtener el perfil del usuario autenticado
function obtenerPerfil(req, res) {
    try {
        const user = req.app.locals.db
            .prepare('SELECT id, usuario, creado_en FROM usuarios WHERE usuario = ?')
            .get(req.usuario);
        if (!user) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
        }
        return res.json(user);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = { registrar, iniciarSesion, obtenerPerfil };