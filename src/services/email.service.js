import { emailConfig, modoReal, transporter } from '../config/email.config.js';

export const escaparHTML = (valor) => {
    if (valor === null || valor === undefined) return '';
    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

export const formatearFecha = (fecha) => {
    const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
    if (Number.isNaN(fechaObj.getTime())) return 'Fecha no disponible';

    return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(fechaObj);
};

export const formatearPrecio = (valor) => {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return '$0,00';
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
    }).format(numero);
};

export const envolverHTML = (contenido, marca = 'DuotechBros') => {
    return `
        <!doctype html>
        <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${escaparHTML(marca)}</title>
        </head>
        <body style="margin:0;padding:0;background:#f3f7fb;font-family:Arial,Helvetica,sans-serif;">
          <div style="max-width:640px;margin:24px auto;background:#ffffff;border:1px solid #dfeaf3;border-radius:16px;overflow:hidden;">
            <div style="padding:28px 30px 18px;background:linear-gradient(135deg,#0b4a62 0%,#0a9396 100%);color:#ffffff;">
              <div style="display:inline-block;width:52px;height:52px;border-radius:14px;background:#ffffff;color:#0b4a62;font-size:30px;font-weight:bold;line-height:52px;text-align:center;">D</div>
              <h1 style="margin:14px 0 0;font-size:26px;letter-spacing:0.5px;">${escaparHTML(marca)}</h1>
            </div>
            <div style="padding:28px 30px 24px;">
              ${contenido}
            </div>
            <div style="padding:16px 20px 22px;text-align:center;color:#7a8c9d;font-size:12px;">
              © ${new Date().getFullYear()} ${escaparHTML(marca)}. Todos los derechos reservados.
            </div>
          </div>
        </body>
        </html>
    `;
};

const normalizarDestinatarios = (destinatarios) => {
    const lista = Array.isArray(destinatarios) ? destinatarios : [destinatarios];
    return [...new Set(
        lista
            .filter((valor) => typeof valor === 'string' && valor.trim() !== '')
            .map((valor) => valor.trim())
    )];
};

export const enviarEmail = async ({ to, subject, title, message, htmlContent, textContent, marca = 'DuotechBros' }) => {
    const destinatarios = normalizarDestinatarios(to);
    if (destinatarios.length === 0) {
        return { enviado: false, modoDesarrollo: true, motivo: 'Sin destinatarios' };
    }

    const contenido = htmlContent || `
        <h2 style="margin:0 0 16px;color:#0b4a62;">${escaparHTML(title || marca)}</h2>
        <p style="margin:0 0 18px;color:#4d5f71;line-height:1.7;">${escaparHTML(message || '')}</p>
    `;

    const textoPlano = textContent || `${title || marca}\n\n${message || ''}`;

    if (!modoReal) {
        console.log('\n========================================');
        console.log(`EMAIL (MODO DESARROLLO)`);
        console.log('========================================');
        console.log(`Para: ${destinatarios.join(', ')}`);
        console.log(`Asunto: ${subject}`);
        console.log(textoPlano);
        console.log('========================================\n');
        return { enviado: false, modoDesarrollo: true, destinatarios };
    }

    try {
        await transporter.sendMail({
            from: emailConfig.from,
            to: destinatarios.join(', '),
            subject,
            text: textoPlano,
            html: envolverHTML(contenido, marca),
        });
        return { enviado: true, modoDesarrollo: false, destinatarios };
    } catch (error) {
        console.error('Error al enviar email:', error.message);
        throw new Error('No se pudo enviar el email.');
    }
};

const enviarCodigo = async ({ destinatario, usuario, codigo, asunto, titulo, mensaje, tipo, marca = 'DuotechBros' }) => {
    const texto = `
${titulo}

${mensaje}

    ${codigo}

Este codigo expira en 10 minutos. Si no solicitaste este email, podes ignorarlo.

- Equipo ${marca}
    `.trim();

    const html = `
        <h2 style="margin:0 0 18px;color:#0b4a62;">${escaparHTML(titulo)}</h2>
        <p style="margin:0 0 18px;color:#4d5f71;line-height:1.7;">${escaparHTML(mensaje)}</p>
        <div style="background:#f0fbfc;border:2px dashed #0a9396;border-radius:12px;padding:20px;text-align:center;margin:18px 0;">
          <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#0b4a62;font-family:'Courier New', monospace;">${escaparHTML(codigo)}</span>
        </div>
        <p style="margin:0;color:#7a8c9d;font-size:13px;line-height:1.6;">Este codigo expira en 10 minutos. Si no solicitaste este email, podes ignorarlo.</p>
    `;

    return enviarEmail({
        to: destinatario,
        subject: asunto,
        title: titulo,
        message: mensaje,
        htmlContent: html,
        textContent: texto,
        marca,
    });
};

export const enviarCodigoVerificacion = async (destinatario, usuario, codigo, marca = 'DuotechBros') => {
    return enviarCodigo({
        destinatario,
        usuario,
        codigo,
        asunto: `Codigo de verificacion - ${marca}`,
        titulo: `Hola ${usuario},`,
        mensaje: `Gracias por registrarte en ${marca}. Para completar tu registro, ingresa el siguiente codigo en la pagina:`,
        tipo: 'registro',
        marca,
    });
};

export const enviarCodigoRecuperacion = async (destinatario, usuario, codigo, marca = 'DuotechBros') => {
    return enviarCodigo({
        destinatario,
        usuario,
        codigo,
        asunto: `Recuperacion de contrasenia - ${marca}`,
        titulo: `Hola ${usuario},`,
        mensaje: 'Recibimos una solicitud para restablecer tu contrasenia. Usa el siguiente codigo para continuar:',
        tipo: 'recuperacion',
        marca,
    });
};

export const enviarConfirmacionReparacion = async (destinatarios, pedido) => {
    const marca = pedido.marca || 'DuotechBros';
    const fecha = formatearFecha(pedido.creado_en);
    const html = `
        <h2 style="margin:0 0 18px;color:#0b4a62;">Solicitud de reparación recibida</h2>
        <p style="margin:0 0 14px;color:#4d5f71;line-height:1.7;">
          Hola ${escaparHTML(pedido.nombre_cliente)}, recibimos tu solicitud de reparación
          <strong>#${escaparHTML(pedido.id)}</strong>.
        </p>
        <p style="margin:0 0 8px;color:#4d5f71;"><strong>Teléfono:</strong> ${escaparHTML(pedido.telefono)}</p>
        <p style="margin:0 0 8px;color:#4d5f71;"><strong>Email:</strong> ${escaparHTML(pedido.email)}</p>
        <p style="margin:0 0 8px;color:#4d5f71;"><strong>Equipo:</strong> ${escaparHTML(pedido.modelo_celular)}</p>
        <p style="margin:0 0 8px;color:#4d5f71;"><strong>Fecha:</strong> ${escaparHTML(fecha)}</p>
        <p style="margin:0 0 8px;color:#4d5f71;"><strong>Problema informado:</strong></p>
        <p style="margin:0;color:#4d5f71;line-height:1.7;white-space:pre-wrap;">${escaparHTML(pedido.descripcion_problema)}</p>
    `;
    const texto = [
        `Solicitud de reparación recibida #${pedido.id}`,
        `Cliente: ${pedido.nombre_cliente}`,
        `Teléfono: ${pedido.telefono}`,
        `Email: ${pedido.email}`,
        `Equipo: ${pedido.modelo_celular}`,
        `Fecha: ${fecha}`,
        `Problema: ${pedido.descripcion_problema}`,
    ].join('\n');

    return Promise.all(
        normalizarDestinatarios(destinatarios).map((destinatario) =>
            enviarEmail({
                to: destinatario,
                subject: `Confirmación de reparación #${pedido.id} - ${marca}`,
                title: `Solicitud de reparación #${pedido.id}`,
                message: `Recibimos la solicitud de reparación de ${pedido.nombre_cliente}.`,
                htmlContent: html,
                textContent: texto,
                marca,
            })
        )
    );
};

export const enviarConfirmacionCompra = async ({ destinatario, nombreCliente, pedidoId, total, items = [], fecha = new Date(), marca = 'DuotechBros' }) => {
    const resumenItems = (items || []).map((item) => {
        const nombre = item.nombre_producto || item.nombre || 'Producto';
        const cantidad = item.cantidad || 1;
        const precio = formatearPrecio(item.precio_unitario ?? item.precio ?? 0);
        return `<li style="margin:6px 0;color:#3b4a5a;">${escaparHTML(nombre)} · ${cantidad} x ${escaparHTML(precio)}</li>`;
    }).join('');

    const html = `
        <h2 style="margin:0 0 18px;color:#0b4a62;">¡Gracias por tu compra ${escaparHTML(nombreCliente)}!</h2>
        <p style="margin:0 0 12px;color:#4d5f71;line-height:1.7;">Tu pedido <strong>#${escaparHTML(pedidoId)}</strong> fue recibido correctamente.</p>
        <p style="margin:0 0 18px;color:#4d5f71;line-height:1.7;">Fecha: ${escaparHTML(formatearFecha(fecha))}</p>
        <ul style="margin:0 0 18px;padding-left:20px;">${resumenItems || '<li style="color:#3b4a5a;">Sin detalle de productos.</li>'}</ul>
        <p style="margin:0 0 18px;color:#4d5f71;line-height:1.7;">Total estimado: <strong>${escaparHTML(formatearPrecio(total))}</strong></p>
        <p style="margin:0;color:#4d5f71;line-height:1.7;">Nos pondremos en contacto contigo pronto para coordinar entrega o retiro.</p>
    `;

    return enviarEmail({
        to: destinatario,
        subject: `Confirmación de compra #${pedidoId} - ${marca}`,
        title: `Pedido #${pedidoId} confirmado`,
        message: `Hola ${nombreCliente}, tu compra fue recibida correctamente.`,
        htmlContent: html,
        textContent: `Hola ${nombreCliente}, tu pedido #${pedidoId} fue recibido correctamente. Total: ${formatearPrecio(total)}.`,
        marca,
    });
};

export const notificarAdminCompra = async ({ emailAdmin, nombreCliente, pedidoId, total, items = [], fecha = new Date(), marca = 'DuotechBros' }) => {
    const resumenItems = (items || []).map((item) => {
        const nombre = item.nombre_producto || item.nombre || 'Producto';
        const cantidad = item.cantidad || 1;
        const precio = formatearPrecio(item.precio_unitario ?? item.precio ?? 0);
        return `- ${nombre} (${cantidad}x) - ${precio}`;
    }).join('\n');

    const html = `
        <h2 style="margin:0 0 18px;color:#0b4a62;">Nueva compra recibida</h2>
        <p style="margin:0 0 12px;color:#4d5f71;line-height:1.7;"><strong>Cliente:</strong> ${escaparHTML(nombreCliente)}</p>
        <p style="margin:0 0 12px;color:#4d5f71;line-height:1.7;"><strong>Pedido:</strong> #${escaparHTML(pedidoId)}</p>
        <p style="margin:0 0 12px;color:#4d5f71;line-height:1.7;"><strong>Fecha:</strong> ${escaparHTML(formatearFecha(fecha))}</p>
        <p style="margin:0 0 12px;color:#4d5f71;line-height:1.7;"><strong>Productos:</strong></p>
        <p style="margin:0 0 18px;color:#4d5f71;line-height:1.7;white-space:pre-wrap;">${escaparHTML(resumenItems || 'Sin detalle')}</p>
        <p style="margin:0;color:#4d5f71;line-height:1.7;"><strong>Total:</strong> ${escaparHTML(formatearPrecio(total))}</p>
    `;

    return enviarEmail({
        to: emailAdmin,
        subject: `Nueva compra #${pedidoId} - ${marca}`,
        title: 'Nueva compra recibida',
        message: `El cliente ${nombreCliente} realizó una nueva compra con pedido #${pedidoId}.`,
        htmlContent: html,
        textContent: `Nueva compra recibida\nCliente: ${nombreCliente}\nPedido: #${pedidoId}\nTotal: ${formatearPrecio(total)}\n${resumenItems || 'Sin detalle'}`,
        marca,
    });
};

export const enviarCompraYNotificacion = async ({ destinatario, emailAdmin, nombreCliente, pedidoId, total, items = [], fecha = new Date(), marca = 'DuotechBros' }) => {
    const resultados = [];

    if (destinatario) {
        resultados.push(
            await enviarConfirmacionCompra({
                destinatario,
                nombreCliente,
                pedidoId,
                total,
                items,
                fecha,
                marca,
            })
        );
    }

    if (emailAdmin) {
        resultados.push(
            await notificarAdminCompra({
                emailAdmin,
                nombreCliente,
                pedidoId,
                total,
                items,
                fecha,
                marca,
            })
        );
    }

    return resultados;
};