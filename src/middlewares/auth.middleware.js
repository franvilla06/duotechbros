const crypto = require('crypto');

// clave secreta para firmar tokens (en produccion deberia ir en variables de entorno)
const SECRET = 'duotech-secret-2024';

// generar un token simple firmado con sha256
// formato: rol.usuario.timestamp.hash
function generarToken(rol, usuario) {
    const timestamp = Date.now();
    const hash = crypto
        .createHash('sha256')
        .update(`${rol}-${usuario}-${timestamp}-${SECRET}`)
        .digest('hex')
        .substring(0, 16);
    return `${rol}.${usuario}.${timestamp}.${hash}`;
}

// verificar que el token sea valido y tenga el rol esperado
function verificarToken(token, rolEsperado) {
    if (!token || typeof token !== 'string') return false;

    const partes = token.split('.');
    if (partes.length !== 4) return false;

    const [rol, usuario, timestamp, hash] = partes;
    if (rol !== rolEsperado) return false;

    const hashEsperado = crypto
        .createHash('sha256')
        .update(`${rol}-${usuario}-${timestamp}-${SECRET}`)
        .digest('hex')
        .substring(0, 16);

    return hash === hashEsperado;
}

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
    generarToken,
    verificarToken,
    requiereAuth,
    requiereAuthUsuario,
};