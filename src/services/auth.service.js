const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const adminModel = require('../models/admin.model');
const usuariosModel = require('../models/usuarios.model');
const verificacionModel = require('../models/verificacion.model');
const emailService = require('./email.service');
const { generarToken } = require('../utils/token.util');

// REGISTRO CON VERIFICACION POR EMAIL

// inicia el proceso de registro
// valida que el usuario y email no existan, hashea la password,
// genera un codigo y lo envia por email
// NO crea el usuario todavia
async function iniciarRegistro(db, usuario, email, password) {
    // validar que el usuario no exista
    const existeUsuario = usuariosModel.contarPorUsuario(db, usuario);
    if (existeUsuario.count > 0) {
        return { error: 'Ese nombre de usuario ya esta en uso.' };
    }

    // validar que el email no este registrado
    const emailExistente = db
        .prepare('SELECT COUNT(*) as count FROM usuarios WHERE email = ?')
        .get(email);
    if (emailExistente.count > 0) {
        return { error: 'Ese email ya esta registrado.' };
    }

    // hashear la password antes de guardarla
    const hash = bcrypt.hashSync(password, 10);

    // generar codigo de 6 digitos (criptograficamente seguro)
    const codigo = crypto.randomInt(100000, 999999).toString();

    // expiracion: 10 minutos
    const expiraEn = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // guardar el codigo en la tabla temporal
    verificacionModel.crear(db, {
        usuario,
        email,
        password_hash: hash,
        codigo,
        expira_en: expiraEn,
    });

    // enviar el email
    await emailService.enviarCodigoVerificacion(email, usuario, codigo);

    return { exito: true, email };
}

// verifica el codigo y crea el usuario definitivo
function verificarCodigo(db, email, codigo) {
    // limpiar codigos vencidos
    verificacionModel.limpiarVencidos(db);

    const registro = verificacionModel.buscarPorEmail(db, email);

    if (!registro) {
        return { error: 'No hay un codigo activo para este email. Solicita uno nuevo.' };
    }

    // verificar expiracion
    const ahora = new Date();
    const expira = new Date(registro.expira_en);
    if (ahora > expira) {
        verificacionModel.eliminar(db, registro.id);
        return { error: 'El codigo expiro. Solicita uno nuevo.' };
    }

    // verificar intentos (maximo 5)
    if (registro.intentos >= 5) {
        verificacionModel.eliminar(db, registro.id);
        return { error: 'Se superaron los intentos permitidos. Solicita un nuevo codigo.' };
    }

    // verificar que el codigo coincida
    if (registro.codigo !== codigo) {
        verificacionModel.incrementarIntentos(db, registro.id);
        const restantes = 5 - (registro.intentos + 1);
        return { error: `Codigo incorrecto. Intentos restantes: ${restantes}.` };
    }

    // codigo correcto: crear el usuario definitivo
    // usamos transaccion para no dejar el codigo usado sin crear el usuario
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

// reenvia el codigo al email (si ya existe un registro pendiente)
async function reenviarCodigo(db, email) {
    const registro = verificacionModel.buscarPorEmail(db, email);

    if (!registro) {
        return { error: 'No hay un registro pendiente para este email. Volve a registrarte.' };
    }

    // generar un nuevo codigo
    const nuevoCodigo = crypto.randomInt(100000, 999999).toString();
    const nuevaExpiracion = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // actualizar el codigo existente
    db.prepare(
        'UPDATE codigos_verificacion SET codigo = ?, expira_en = ?, intentos = 0 WHERE id = ?'
    ).run(nuevoCodigo, nuevaExpiracion, registro.id);

    // enviar el email
    await emailService.enviarCodigoVerificacion(email, registro.usuario, nuevoCodigo);

    return { exito: true };
}

// LOGIN

function autenticarUsuario(db, usuario, password) {
    const user = usuariosModel.buscarPorUsuario(db, usuario);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) return null;

    return {
        usuario: user.usuario,
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
    autenticarUsuario,
    autenticarAdministrador,
    cambiarPassword,
    darDeBaja,
};