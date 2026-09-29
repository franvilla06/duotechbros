const { verificarToken } = require('../utils/token.util');

// extraer el token del header authorization
function extraerToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    return authHeader.substring(7);
}

// middleware para rutas de administrador
function requiereAuth(req, res, next) {
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
    const partes = token.split('.');
    req.usuario = partes[1];
    req.rol = partes[0];
    next();
}

// middleware para rutas de usuario
function requiereAuthUsuario(req, res, next) {
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
    const partes = token.split('.');
    req.usuario = partes[1];
    req.rol = partes[0];
    next();
}

module.exports = {
    requiereAuth,
    requiereAuthUsuario,
};