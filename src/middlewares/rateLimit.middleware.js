import { rateLimit } from 'express-rate-limit';

// limita los intentos de inicio de sesión y verificación por dirección IP
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

// limita los envíos de correos de registro, recuperación y reenvío por dirección IP
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
