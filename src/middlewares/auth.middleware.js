import { verificarToken, extraerDatosToken } from '../utils/token.util.js';
import * as usuariosModel from '../models/usuarios.model.js';
import * as adminModel from '../models/admin.model.js';

// extrae el token de acceso del encabezado Authorization
export const extraerToken = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    return authHeader.substring(7);
};

// valida el token y su versión antes de permitir el acceso del administrador
export const requiereAuth = async (req, res, next) => {
    const token = extraerToken(req);
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'No autorizado. Falta el token de acceso.',
        });
    }
    if (!verificarToken(token, 'admin')) {
        return res.status(401).json({
            success: false,
            error: 'Token invalido o expirado. Volve a iniciar sesion.',
        });
    }
    const datos = extraerDatosToken(token);
    try {
        const admin = await adminModel.buscarPorUsuario(req.app.locals.pool, datos.usuario);
        if (!admin || Number(admin.token_version) !== datos.version) {
            return res.status(401).json({
                success: false,
                error: 'Sesion invalidada por cambio de credenciales. Volve a iniciar sesion.',
            });
        }

        req.usuario = datos.usuario;
        req.rol = datos.rol;
        return next();
    } catch (error) {
        console.error('Error validando sesion de administrador:', error);
        return res.status(500).json({ success: false, error: 'Error validando sesion.' });
    }
};

// valida el token y su versión antes de permitir el acceso del usuario
export const requiereAuthUsuario = async (req, res, next) => {
    const token = extraerToken(req);
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'No autorizado. Falta el token de acceso.',
        });
    }
    if (!verificarToken(token, 'usuario')) {
        return res.status(401).json({
            success: false,
            error: 'Token invalido o expirado. Volve a iniciar sesion.',
        });
    }
    const datos = extraerDatosToken(token);
    try {
        const user = await usuariosModel.buscarPorUsuario(req.app.locals.pool, datos.usuario);
        if (!user || Number(user.token_version) !== datos.version) {
            return res.status(401).json({
                success: false,
                error: 'Sesion invalidada por cambio de credenciales. Volve a iniciar sesion.',
            });
        }

        req.usuario = datos.usuario;
        req.rol = datos.rol;
        return next();
    } catch (error) {
        console.error('Error validando sesion de usuario:', error);
        return res.status(500).json({ success: false, error: 'Error validando sesion.' });
    }
};
