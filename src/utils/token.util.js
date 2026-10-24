import crypto from 'crypto';
import { authConfig } from '../config/auth.config.js';

export const generarToken = (rol, usuario) => {
    const timestamp = Date.now();
    const hash = crypto
        .createHash('sha256')
        .update(`${rol}-${usuario}-${timestamp}-${authConfig.secret}`)
        .digest('hex')
        .substring(0, 16);
    return `${rol}.${usuario}.${timestamp}.${hash}`;
};

export const verificarToken = (token, rolEsperado) => {
    if (!token || typeof token !== 'string') return false;

    const partes = token.split('.');
    if (partes.length !== 4) return false;

    const [rol, usuario, timestamp, hash] = partes;
    if (rol !== rolEsperado) return false;

    if (!/^\d+$/.test(timestamp)) return false;
    const emision = Number(timestamp);
    const ahora = Date.now();
    if (
        !Number.isSafeInteger(emision) ||
        emision > ahora ||
        ahora - emision > authConfig.expiracionMs
    ) {
        return false;
    }

    const hashEsperado = crypto
        .createHash('sha256')
        .update(`${rol}-${usuario}-${timestamp}-${authConfig.secret}`)
        .digest('hex')
        .substring(0, 16);

    if (!/^[a-f0-9]{16}$/.test(hash)) return false;
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hashEsperado));
};
