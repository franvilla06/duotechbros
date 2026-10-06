const { config, modoReal, transporter } = require('../config/email.config');

// envia el codigo de verificacion por email
// en modo desarrollo, muestra el codigo en consola en lugar de enviarlo
async function enviarCodigoVerificacion(destinatario, usuario, codigo) {
    const asunto = 'Codigo de verificacion - DuotechBros';

    // version texto plano (fallback)
    const texto = `
Hola ${usuario},

Tu codigo de verificacion es:

    ${codigo}

Este codigo expira en 10 minutos. Si no solicitaste este registro, podes ignorar este mensaje.

- Equipo DuotechBros
    `.trim();

    // version HTML (mas linda)
    const html = `
        <div style="font-family: Arial, Helvetica, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0b4a62 0%, #0a9396 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <div style="display: inline-block; width: 50px; height: 50px; background-color: #ffffff; border-radius: 12px; color: #0b4a62; font-size: 24px; font-weight: bold; line-height: 50px;">D</div>
                <h1 style="color: #ffffff; margin: 12px 0 0; font-size: 22px;">DuotechBros</h1>
            </div>
            <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0eaf0; border-top: none; border-radius: 0 0 12px 12px;">
                <h2 style="color: #0b4a62; margin: 0 0 16px; font-size: 18px;">Hola ${usuario},</h2>
                <p style="color: #555; line-height: 1.6; margin: 0 0 20px;">
                    Gracias por registrarte en DuotechBros. Para completar tu registro, ingresa el siguiente codigo en la pagina:
                </p>
                <div style="background-color: #f7feff; border: 2px dashed #0a9396; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
                    <div style="font-size: 36px; font-weight: bold; color: #0b4a62; letter-spacing: 8px; font-family: 'Courier New', monospace;">${codigo}</div>
                </div>
                <p style="color: #888; font-size: 13px; line-height: 1.5; margin: 20px 0 0;">
                    Este codigo expira en 10 minutos. Si no solicitaste este registro, podes ignorar este mensaje.
                </p>
            </div>
            <div style="text-align: center; padding: 16px; color: #999; font-size: 12px;">
                &copy; ${new Date().getFullYear()} DuotechBros. Todos los derechos reservados.
            </div>
        </div>
    `;

    // modo desarrollo: no enviamos nada, mostramos en consola
    if (!modoReal) {
        console.log('\n========================================');
        console.log('CODIGO DE VERIFICACION (MODO DESARROLLO)');
        console.log('========================================');
        console.log(`Para: ${destinatario}`);
        console.log(`Usuario: ${usuario}`);
        console.log(`Codigo: ${codigo}`);
        console.log('========================================\n');
        return { enviado: false, modoDesarrollo: true };
    }

    // modo real: enviamos con nodemailer
    try {
        await transporter.sendMail({
            from: config.from,
            to: destinatario,
            subject: asunto,
            text: texto,
            html: html,
        });
        return { enviado: true, modoDesarrollo: false };
    } catch (error) {
        console.error('Error al enviar email:', error.message);
        throw new Error('No se pudo enviar el email de verificacion.');
    }
}

module.exports = { enviarCodigoVerificacion };