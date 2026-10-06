const nodemailer = require('nodemailer');

// lee la configuracion desde .env
// si SMTP_HOST esta vacio, el servicio queda en modo desarrollo
const config = {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'DuotechBros <no-reply@duotechbros.com>',
};

// indica si hay credenciales configuradas
const modoReal = config.host !== '' && config.user !== '';

// transporte de nodemailer
// en modo desarrollo, usamos un "json transport" que no envia nada real
let transporter = null;

if (modoReal) {
    transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465,
        auth: {
            user: config.user,
            pass: config.pass,
        },
    });
}

module.exports = {
    config,
    modoReal,
    transporter,
};