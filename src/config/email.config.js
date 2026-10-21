import nodemailer from 'nodemailer';

// lee la configuracion desde .env
// si SMTP_HOST esta vacio, el servicio queda en modo desarrollo
export const emailConfig = {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'DuotechBros <no-reply@duotechbros.com>',
};

// indica si hay credenciales configuradas
export const modoReal = emailConfig.host !== '' && emailConfig.user !== '';

// transporte de nodemailer
// en modo desarrollo, usamos un "json transport" que no envia nada real
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
