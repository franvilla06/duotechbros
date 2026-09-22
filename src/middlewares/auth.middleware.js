const crypto = require('crypto');
const SECRET = 'duotech-secret-2024';

function verificarToken(token) {
    if (!token || typeof token !== 'string') return false;

    const partes = token.split('.');
    if (partes.length !== 3) return false;

    const [usuario, timestamp, hash] = partes;
    const hashEsperado = crypto
        .createHash('sha256')
        .update(`${usuario}-${timestamp}-${SECRET}`)
        .digest('hex')
        .substring(0, 16);

    return hash === hashEsperado;
}

function requiereAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'No autorizado. Falta el token de acceso.',
        });
    }

    const token = authHeader.substring(7);

    if (!verificarToken(token)) {
        return res.status(401).json({
            success: false,
            error: 'Token inválido o expirado. Volvé a iniciar sesión.',
        });
    }

    req.usuario = token.split('.')[0];
    next();
}

module.exports = { requiereAuth };