import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import * as adminModel from '../models/admin.model.js';
import * as usuariosModel from '../models/usuarios.model.js';
import * as verificacionModel from '../models/verificacion.model.js';
import * as configuracionModel from '../models/configuracion.model.js';
import * as emailService from './email.service.js';
import { generarToken } from '../utils/token.util.js';

// REGISTRO CON VERIFICACION POR EMAIL

export const iniciarRegistro = async (pool, usuario, email, password) => {
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

    const marca = await configuracionModel.obtener(pool, 'marca_nombre') || 'DuotechBros';
    await emailService.enviarCodigoVerificacion(email, usuario, codigo, marca);

    return { exito: true, email };
};

export const verificarCodigo = async (pool, email, codigo) => {
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
        const updateResult = await verificacionModel.incrementarIntentos(pool, registro.id);

        if (updateResult.affectedRows === 0) {
            await verificacionModel.eliminar(pool, registro.id);
            return { error: 'Se superaron los intentos permitidos. Solicita un nuevo codigo.' };
        }

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

        const token = generarToken('usuario', registro.usuario, 0);

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
};

export const reenviarCodigo = async (pool, email) => {
    const registro = await verificacionModel.buscarPorEmail(pool, email, 'registro');

    if (!registro) {
        return { error: 'No hay un registro pendiente para este email. Volve a registrarte.' };
    };

    const nuevoCodigo = crypto.randomInt(100000, 999999).toString();
    const nuevaExpiracion = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
        'UPDATE codigos_verificacion SET codigo = ?, expira_en = ?, intentos = 0 WHERE id = ?',
        [nuevoCodigo, formatearFechaMySQL(nuevaExpiracion), registro.id]
    );

    const marca = await configuracionModel.obtener(pool, 'marca_nombre') || 'DuotechBros';
    await emailService.enviarCodigoVerificacion(email, registro.usuario, nuevoCodigo, marca);

    return { exito: true };
}

// RECUPERACION DE CONTRASENIA

export const iniciarRecuperacion = async (pool, email) => {
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

    const marca = await configuracionModel.obtener(pool, 'marca_nombre') || 'DuotechBros';
    await emailService.enviarCodigoRecuperacion(email, usuario.usuario, codigo, marca);

    return { exito: true, existe: true };
};

export const restablecerPassword = async (pool, email, codigo, passwordNueva) => {
    await verificacionModel.limpiarVencidos(pool);

    const registro = await verificacionModel.buscarPorEmail(pool, email, 'recuperacion');

    if (!registro) {
        return { error: 'No hay una solicitud de recuperacion activa. Pedi un nuevo codigo.' };
    };

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
        const updateResult = await verificacionModel.incrementarIntentos(pool, registro.id);

        if (updateResult.affectedRows === 0) {
            await verificacionModel.eliminar(pool, registro.id);
            return { error: 'Se superaron los intentos permitidos. Pedi un nuevo codigo.' };
        }

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

    await usuariosModel.resetearIntentos(pool, registro.usuario);
    await usuariosModel.incrementarTokenVersion(pool, registro.usuario);

    return { exito: true, usuario: registro.usuario };
}

// LOGIN

export const autenticarUsuario = async (pool, email, password) => {
    const user = await usuariosModel.buscarPorEmail(pool, email);

    if (!user) return { error: 'Email o contrasenia incorrectos.' };

    if (user.bloqueado_hasta) {
        const ahora = new Date();
        const bloqueo = new Date(user.bloqueado_hasta);
        if (ahora < bloqueo) {
            const minutosRestantes = Math.ceil((bloqueo - ahora) / 60000);
            return {
                error: `Cuenta bloqueada por demasiados intentos. Intenta de nuevo en ${minutosRestantes} minutos o recupera tu contrasenia.`,
            };
        } else {
            await usuariosModel.resetearIntentos(pool, user.usuario);
            user.intentos_fallidos = 0;
            user.bloqueado_hasta = null;
        }
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
        await usuariosModel.registrarIntentoFallido(pool, user.usuario);

        if (user.intentos_fallidos + 1 >= 5 && user.email) {
            const marca = (await configuracionModel.obtener(pool, 'marca_nombre')) || 'DuotechBros';
            await emailService
                .enviarEmail({
                    to: user.email,
                    subject: `Alerta de seguridad - ${marca}`,
                    title: 'Cuenta bloqueada temporalmente',
                    message:
                        'Hemos detectado multiples intentos fallidos de inicio de sesion en tu cuenta. Tu cuenta ha sido bloqueada por 15 minutos. Si no fuiste vos, te recomendamos recuperar tu contrasenia.',
                    marca,
                })
                .catch((error) =>
                    console.error('Error enviando email de bloqueo:', error.message)
                );
        }

        return { error: 'Email o contrasenia incorrectos.' };
    }

    await usuariosModel.resetearIntentos(pool, user.usuario);

    return {
        usuario: user.usuario,
        email: user.email,
        id: user.id,
        token: generarToken('usuario', user.usuario, user.token_version || 0),
    };
};

export const autenticarAdministrador = async (pool, usuario, password) => {
    const admin = await adminModel.buscarPorUsuario(pool, usuario);

    if (!admin) return { error: 'Usuario o contrasenia incorrectos.' };

    if (admin.bloqueado_hasta) {
        const ahora = new Date();
        const bloqueo = new Date(admin.bloqueado_hasta);
        if (ahora < bloqueo) {
            const minutosRestantes = Math.ceil((bloqueo - ahora) / 60000);
            return {
                error: `Cuenta de administrador bloqueada. Intenta de nuevo en ${minutosRestantes} minutos.`,
            };
        } else {
            await adminModel.resetearIntentos(pool, admin.usuario);
            admin.intentos_fallidos = 0;
            admin.bloqueado_hasta = null;
        }
    }

    if (!bcrypt.compareSync(password, admin.password_hash)) {
        await adminModel.registrarIntentoFallido(pool, admin.usuario);
        return { error: 'Usuario o contrasenia incorrectos.' };
    }

    await adminModel.resetearIntentos(pool, admin.usuario);

    return {
        usuario: admin.usuario,
        token: generarToken('admin', admin.usuario, admin.token_version || 0),
    };
};

// PERFIL

export const cambiarPassword = async (pool, usuario, passwordActual, passwordNueva) => {
    const user = await usuariosModel.buscarPorUsuario(pool, usuario);
    if (!user) {
        return { error: 'Usuario no encontrado.' };
    }

    if (!bcrypt.compareSync(passwordActual, user.password_hash)) {
        return { error: 'La contrasenia actual es incorrecta.' };
    }

    const nuevoHash = bcrypt.hashSync(passwordNueva, 10);
    await usuariosModel.actualizarPassword(pool, usuario, nuevoHash);
    await usuariosModel.incrementarTokenVersion(pool, usuario);

    return { success: true };
};

export const darDeBaja = async (pool, usuario) => {
    const user = await usuariosModel.buscarPorUsuario(pool, usuario);
    if (!user) {
        return { error: 'Usuario no encontrado.' };
    }

    await pool.query(
        `UPDATE pedidos SET
            nombre_cliente = 'Cuenta eliminada',
            telefono = '0000000000',
            email = 'eliminado@anonimo.com',
            descripcion_problema = 'Datos eliminados por privacidad'
         WHERE usuario_id = ?`,
        [user.id]
    );

    await usuariosModel.eliminar(pool, usuario);

    return { success: true };
}

// UTILIDAD

// convierte un objeto Date a formato MySQL DATETIME (YYYY-MM-DD HH:MM:SS)
export const formatearFechaMySQL = (fecha) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())} ${pad(
        fecha.getHours()
    )}:${pad(fecha.getMinutes())}:${pad(fecha.getSeconds())}`;
};