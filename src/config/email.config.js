import nodemailer from 'nodemailer';

// carga desde el entorno la configuración del proveedor de correo
export const emailConfig = {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'DuotechBros <no-reply@duotechbros.com>',
};

// indica si el transporte SMTP cuenta con los datos necesarios
export const modoReal = emailConfig.host !== '' && emailConfig.user !== '';

// crea el transporte SMTP únicamente cuando hay credenciales configuradas
let transporter = null;

if (modoReal) {
    transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.port === 465,
        auth: {
            user: emailConfig.user,
            pass: emailConfig.pass,
        },
    });
}

export { transporter };
