const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const adminModel = require('../models/admin.model');
const usuariosModel = require('../models/usuarios.model');
const verificacionModel = require('../models/verificacion.model');
const emailService = require('./email.service');
const { generarToken } = require('../utils/token.util');

// REGISTRO CON VERIFICACION POR EMAIL

async function iniciarRegistro(pool, usuario, email, password) {
    const existeUsuario = await usuariosModel.contarPorUsuario(pool, usuario);
    if (existeUsuario.count > 0) {
        return { error: 'Ese nombre de usuario ya esta en uso.' };
    }

    const emailExistente = await pool.query(
        'SELECT COUNT(*) as count FROM usuarios WHERE email = ?',
        [email]
    );
    if (emailExistente[0][0].count > 0) {
        return { error: 'Ese email ya esta registrado.' };
    }

    const hash = bcrypt.hashSync(password, 10);
    const codigo = crypto.randomInt(100000, 999999).toString();
    const expiraEn = new Date(Date.now() + 10 * 60 * 1000);

    await verificacionModel.crear(pool, {
        usuario,
        email,
        password_hash: hash,
        codigo,
        expira_en: formatearFechaMySQL(expiraEn),
    });

    await emailService.enviarCodigoVerificacion(email, usuario, codigo);

    return { exito: true, email };
}

async function verificarCodigo(pool, email, codigo) {
    await verificacionModel.limpiarVencidos(pool);

    const registro = await verificacionModel.buscarPorEmail(pool, email, 'registro');

    if (!registro) {
        return { error: 'No hay un codigo activo para este email. Solicita uno nuevo.' };
    }

    const ahora = new Date();
    const expira = new Date(registro.expira_en);
    if (ahora > expira) {
        await verificacionModel.eliminar(pool, registro.id);
        return { error: 'El codigo expiro. Solicita uno nuevo.' };
    }

    if (registro.intentos >= 5) {
        await verificacionModel.eliminar(pool, registro.id);
        return { error: 'Se superaron los intentos permitidos. Solicita un nuevo codigo.' };
    }

    if (registro.codigo !== codigo) {
        await verificacionModel.incrementarIntentos(pool, registro.id);
        const restantes = 5 - (registro.intentos + 1);
        return { error: `Codigo incorrecto. Intentos restantes: ${restantes}.` };
    }

    // crear usuario + marcar codigo como usado en una transaccion
    const conexion = await pool.getConnection();
    try {
        await conexion.beginTransaction();

        const [result] = await conexion.query(
            'INSERT INTO usuarios (usuario, email, password_hash) VALUES (?, ?, ?)',
            [registro.usuario, registro.email, registro.password_hash]
        );

        await conexion.query('UPDATE codigos_verificacion SET usado = 1 WHERE id = ?', [
            registro.id,
        ]);

        await conexion.commit();

        const token = generarToken('usuario', registro.usuario);

        return {
            exito: true,
            usuario: registro.usuario,
            id: result.insertId,
            token,
        };
    } catch (error) {
        await conexion.rollback();
        throw error;
    } finally {
        conexion.release();
    }
}

async function reenviarCodigo(pool, email) {
    const registro = await verificacionModel.buscarPorEmail(pool, email, 'registro');

    if (!registro) {
        return { error: 'No hay un registro pendiente para este email. Volve a registrarte.' };
    }

    const nuevoCodigo = crypto.randomInt(100000, 999999).toString();
    const nuevaExpiracion = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
        'UPDATE codigos_verificacion SET codigo = ?, expira_en = ?, intentos = 0 WHERE id = ?',
        [nuevoCodigo, formatearFechaMySQL(nuevaExpiracion), registro.id]
    );

    await emailService.enviarCodigoVerificacion(email, registro.usuario, nuevoCodigo);

    return { exito: true };
}

// RECUPERACION DE CONTRASENIA

async function iniciarRecuperacion(pool, email) {
    const [rows] = await pool.query(
        'SELECT usuario, email FROM usuarios WHERE email = ?',
        [email]
    );
    const usuario = rows[0];

    if (!usuario) {
        // no revelamos si el email esta registrado
        return { exito: true, existe: false };
    }

    const codigo = crypto.randomInt(100000, 999999).toString();
    const expiraEn = new Date(Date.now() + 10 * 60 * 1000);

    await verificacionModel.crearRecuperacion(pool, {
        usuario: usuario.usuario,
        email: usuario.email,
        codigo,
        expira_en: formatearFechaMySQL(expiraEn),
    });

    await emailService.enviarCodigoRecuperacion(email, usuario.usuario, codigo);

    return { exito: true, existe: true };
}

async function restablecerPassword(pool, email, codigo, passwordNueva) {
    await verificacionModel.limpiarVencidos(pool);

    const registro = await verificacionModel.buscarPorEmail(pool, email, 'recuperacion');

    if (!registro) {
        return { error: 'No hay una solicitud de recuperacion activa. Pedi un nuevo codigo.' };
    }

    const ahora = new Date();
    const expira = new Date(registro.expira_en);
    if (ahora > expira) {
        await verificacionModel.eliminar(pool, registro.id);
        return { error: 'El codigo expiro. Pedi uno nuevo.' };
    }

    if (registro.intentos >= 5) {
        await verificacionModel.eliminar(pool, registro.id);
        return { error: 'Se superaron los intentos permitidos. Pedi un nuevo codigo.' };
    }

    if (registro.codigo !== codigo) {
        await verificacionModel.incrementarIntentos(pool, registro.id);
        const restantes = 5 - (registro.intentos + 1);
        return { error: `Codigo incorrecto. Intentos restantes: ${restantes}.` };
    }

    const user = await usuariosModel.buscarPorUsuario(pool, registro.usuario);
    if (!user) {
        return { error: 'Usuario no encontrado.' };
    }

    const nuevoHash = bcrypt.hashSync(passwordNueva, 10);

    const conexion = await pool.getConnection();
    try {
        await conexion.beginTransaction();

        await conexion.query('UPDATE usuarios SET password_hash = ? WHERE usuario = ?', [
            nuevoHash,
            registro.usuario,
        ]);

        await conexion.query('UPDATE codigos_verificacion SET usado = 1 WHERE id = ?', [
            registro.id,
        ]);

        await conexion.commit();
    } catch (error) {
        await conexion.rollback();
        throw error;
    } finally {
        conexion.release();
    }

    return { exito: true, usuario: registro.usuario };
}

// LOGIN

async function autenticarUsuario(pool, email, password) {
    const user = await usuariosModel.buscarPorEmail(pool, email);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) return null;

    return {
        usuario: user.usuario,
        email: user.email,
        id: user.id,
        token: generarToken('usuario', user.usuario),
    };
}

async function autenticarAdministrador(pool, usuario, password) {
    const admin = await adminModel.buscarPorUsuario(pool, usuario);
    if (!admin || !bcrypt.compareSync(password, admin.password_hash)) return null;

    return {
        usuario: admin.usuario,
        token: generarToken('admin', admin.usuario),
    };
}

// PERFIL

async function cambiarPassword(pool, usuario, passwordActual, passwordNueva) {
    const user = await usuariosModel.buscarPorUsuario(pool, usuario);
    if (!user) {
        return { error: 'Usuario no encontrado.' };
    }

    if (!bcrypt.compareSync(passwordActual, user.password_hash)) {
        return { error: 'La contrasenia actual es incorrecta.' };
    }

    const nuevoHash = bcrypt.hashSync(passwordNueva, 10);
    await usuariosModel.actualizarPassword(pool, usuario, nuevoHash);

    return { success: true };
}

async function darDeBaja(pool, usuario) {
    const user = await usuariosModel.buscarPorUsuario(pool, usuario);
    if (!user) {
        return { error: 'Usuario no encontrado.' };
    }

    await usuariosModel.eliminar(pool, usuario);

    return { success: true };
}

// UTILIDAD

// convierte un objeto Date a formato MySQL DATETIME (YYYY-MM-DD HH:MM:SS)
function formatearFechaMySQL(fecha) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())} ${pad(
        fecha.getHours()
    )}:${pad(fecha.getMinutes())}:${pad(fecha.getSeconds())}`;
}

module.exports = {
    iniciarRegistro,
    verificarCodigo,
    reenviarCodigo,
    iniciarRecuperacion,
    restablecerPassword,
    autenticarUsuario,
    autenticarAdministrador,
    cambiarPassword,
    darDeBaja,
};