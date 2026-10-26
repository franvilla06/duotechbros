import crypto from 'crypto';
import { authConfig } from '../config/auth.config.js';

export const generarToken = (rol, usuario, tokenVersion = 0) => {
    const timestamp = Date.now();
    const version = tokenVersion || 0;
    const hash = crypto
        .createHash('sha256')
        .update(`${rol}-${usuario}-${timestamp}-${version}-${authConfig.secret}`)
        .digest('hex')
        .substring(0, 16);
    return `${rol}.${usuario}.${timestamp}.${version}.${hash}`;
};

export const verificarToken = (token, rolEsperado) => {
    if (!token || typeof token !== 'string') return false;

    const partes = token.split('.');
    if (partes.length !== 5) return false;

    const [rol, usuario, timestamp, version, hash] = partes;
    if (rol !== rolEsperado) return false;

    if (!/^\d+$/.test(timestamp)) return false;
    if (!/^\d+$/.test(version) || !Number.isSafeInteger(Number(version))) return false;
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
        .update(`${rol}-${usuario}-${timestamp}-${version}-${authConfig.secret}`)
        .digest('hex')
        .substring(0, 16);

    if (!/^[a-f0-9]{16}$/.test(hash)) return false;
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hashEsperado));
};

export const extraerDatosToken = (token) => {
    if (!token || typeof token !== 'string') return null;

    const partes = token.split('.');
    if (partes.length !== 5) return null;

    return {
        rol: partes[0],
        usuario: partes[1],
        timestamp: partes[2],
        version: Number(partes[3]),
    };
};
