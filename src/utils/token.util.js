const crypto = require('crypto');
const { secret } = require('../config/auth.config');

function generarToken(rol, usuario) {
    const timestamp = Date.now();
    const hash = crypto
        .createHash('sha256')
        .update(`${rol}-${usuario}-${timestamp}-${secret}`)
        .digest('hex')
        .substring(0, 16);
    return `${rol}.${usuario}.${timestamp}.${hash}`;
}

function verificarToken(token, rolEsperado) {
    if (!token || typeof token !== 'string') return false;

    const partes = token.split('.');
    if (partes.length !== 4) return false;

    const [rol, usuario, timestamp, hash] = partes;
    if (rol !== rolEsperado) return false;

    const hashEsperado = crypto
        .createHash('sha256')
        .update(`${rol}-${usuario}-${timestamp}-${secret}`)
        .digest('hex')
        .substring(0, 16);

    return hash === hashEsperado;
}

module.exports = { generarToken, verificarToken };
