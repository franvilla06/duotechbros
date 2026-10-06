const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const adminModel = require('../models/admin.model');
const usuariosModel = require('../models/usuarios.model');
const verificacionModel = require('../models/verificacion.model');
const emailService = require('./email.service');
const { generarToken } = require('../utils/token.util');

// REGISTRO CON VERIFICACION POR EMAIL

async function iniciarRegistro(db, usuario, email, password) {
    const existeUsuario = usuariosModel.contarPorUsuario(db, usuario);
    if (existeUsuario.count > 0) {
        return { error: 'Ese nombre de usuario ya esta en uso.' };
    }

    const emailExistente = db
        .prepare('SELECT COUNT(*) as count FROM usuarios WHERE email = ?')
        .get(email);
    if (emailExistente.count > 0) {
        return { error: 'Ese email ya esta registrado.' };
    }

    const hash = bcrypt.hashSync(password, 10);
    const codigo = crypto.randomInt(100000, 999999).toString();
    const expiraEn = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    verificacionModel.crear(db, {
        usuario,
        email,
        password_hash: hash,
        codigo,
        expira_en: expiraEn,
    });

    await emailService.enviarCodigoVerificacion(email, usuario, codigo);

    return { exito: true, email };
}

function verificarCodigo(db, email, codigo) {
    verificacionModel.limpiarVencidos(db);

    const registro = verificacionModel.buscarPorEmail(db, email, 'registro');

    if (!registro) {
        return { error: 'No hay un codigo activo para este email. Solicita uno nuevo.' };
    }

    const ahora = new Date();
    const expira = new Date(registro.expira_en);
    if (ahora > expira) {
        verificacionModel.eliminar(db, registro.id);
        return { error: 'El codigo expiro. Solicita uno nuevo.' };
    }

    if (registro.intentos >= 5) {
        verificacionModel.eliminar(db, registro.id);
        return { error: 'Se superaron los intentos permitidos. Solicita un nuevo codigo.' };
    }

    if (registro.codigo !== codigo) {
        verificacionModel.incrementarIntentos(db, registro.id);
        const restantes = 5 - (registro.intentos + 1);
        return { error: `Codigo incorrecto. Intentos restantes: ${restantes}.` };
    }

    const crearUsuario = db.transaction(() => {
        const info = usuariosModel.crearConEmail(
            db,
            registro.usuario,
            registro.email,
            registro.password_hash
        );
        verificacionModel.marcarUsado(db, registro.id);
        return info;
    });

    const info = crearUsuario();

    const token = generarToken('usuario', registro.usuario);

    return {
        exito: true,
        usuario: registro.usuario,
        id: info.lastInsertRowid,
        token,
    };
}

async function reenviarCodigo(db, email) {
    const registro = verificacionModel.buscarPorEmail(db, email, 'registro');

    if (!registro) {
        return { error: 'No hay un registro pendiente para este email. Volve a registrarte.' };
    }

    const nuevoCodigo = crypto.randomInt(100000, 999999).toString();
    const nuevaExpiracion = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    db.prepare(
        'UPDATE codigos_verificacion SET codigo = ?, expira_en = ?, intentos = 0 WHERE id = ?'
    ).run(nuevoCodigo, nuevaExpiracion, registro.id);

    await emailService.enviarCodigoVerificacion(email, registro.usuario, nuevoCodigo);

    return { exito: true };
}

// RECUPERACION DE CONTRASENIA

// paso 1: el usuario envia su email
// se genera un codigo y se envia por email
// por seguridad, siempre devolvemos exito (aunque el email no exista)
// para no filtrar que emails estan registrados
async function iniciarRecuperacion(db, email) {
    const usuario = db.prepare('SELECT usuario, email FROM usuarios WHERE email = ?').get(email);

    // si el email no existe, igual devolvemos exito (no revelamos si esta registrado)
    if (!usuario) {
        return { exito: true, existe: false };
    }

    const codigo = crypto.randomInt(100000, 999999).toString();
    const expiraEn = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    verificacionModel.crearRecuperacion(db, {
        usuario: usuario.usuario,
        email: usuario.email,
        codigo,
        expira_en: expiraEn,
    });

    await emailService.enviarCodigoRecuperacion(email, usuario.usuario, codigo);

    return { exito: true, existe: true };
}

// paso 2: el usuario envia email + codigo + nueva contrasenia
function restablecerPassword(db, email, codigo, passwordNueva) {
    verificacionModel.limpiarVencidos(db);

    const registro = verificacionModel.buscarPorEmail(db, email, 'recuperacion');

    if (!registro) {
        return { error: 'No hay una solicitud de recuperacion activa. Pedi un nuevo codigo.' };
    }

    const ahora = new Date();
    const expira = new Date(registro.expira_en);
    if (ahora > expira) {
        verificacionModel.eliminar(db, registro.id);
        return { error: 'El codigo expiro. Pedi uno nuevo.' };
    }

    if (registro.intentos >= 5) {
        verificacionModel.eliminar(db, registro.id);
        return { error: 'Se superaron los intentos permitidos. Pedi un nuevo codigo.' };
    }

    if (registro.codigo !== codigo) {
        verificacionModel.incrementarIntentos(db, registro.id);
        const restantes = 5 - (registro.intentos + 1);
        return { error: `Codigo incorrecto. Intentos restantes: ${restantes}.` };
    }

    // verificar que el usuario exista
    const user = usuariosModel.buscarPorUsuario(db, registro.usuario);
    if (!user) {
        return { error: 'Usuario no encontrado.' };
    }

    // actualizar la contrasenia y marcar el codigo como usado
    const ejecutar = db.transaction(() => {
        const nuevoHash = bcrypt.hashSync(passwordNueva, 10);
        usuariosModel.actualizarPassword(db, registro.usuario, nuevoHash);
        verificacionModel.marcarUsado(db, registro.id);
    });

    ejecutar();

    return { exito: true, usuario: registro.usuario };
}

// LOGIN

// autentica un usuario por email (el email es unico)
// el login se hace con email, no con nombre de usuario
function autenticarUsuario(db, email, password) {
    const user = usuariosModel.buscarPorEmail(db, email);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) return null;

    return {
        usuario: user.usuario,
        email: user.email,
        id: user.id,
        token: generarToken('usuario', user.usuario),
    };
}

function autenticarAdministrador(db, usuario, password) {
    const admin = adminModel.buscarPorUsuario(db, usuario);
    if (!admin || !bcrypt.compareSync(password, admin.password_hash)) return null;

    return {
        usuario: admin.usuario,
        token: generarToken('admin', admin.usuario),
    };
}

// PERFIL

function cambiarPassword(db, usuario, passwordActual, passwordNueva) {
    const user = usuariosModel.buscarPorUsuario(db, usuario);
    if (!user) {
        return { error: 'Usuario no encontrado.' };
    }

    if (!bcrypt.compareSync(passwordActual, user.password_hash)) {
        return { error: 'La contrasenia actual es incorrecta.' };
    }

    const nuevoHash = bcrypt.hashSync(passwordNueva, 10);
    usuariosModel.actualizarPassword(db, usuario, nuevoHash);

    return { success: true };
}

function darDeBaja(db, usuario) {
    const user = usuariosModel.buscarPorUsuario(db, usuario);
    if (!user) {
        return { error: 'Usuario no encontrado.' };
    }

    usuariosModel.eliminar(db, usuario);

    return { success: true };
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