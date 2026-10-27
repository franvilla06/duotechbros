import { rateLimit } from 'express-rate-limit';

// limitador general para login y verificacion de codigos
// permite maximo 10 intentos cada 15 minutos por ip
export const limitadorAuth = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        error: 'Demasiados intentos. Por favor, intenta de nuevo en 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// limitador estricto para envio de correos (registro, recuperacion, reenvio)
// permite maximo 5 envios cada 1 hora por ip
export const limitadorEmails = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        error: 'Demasiadas solicitudes de codigo. Por favor, intenta de nuevo en 1 hora.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
