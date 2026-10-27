// SCRIPT COMUN DEL SITIO PUBLICO
// carga la configuracion del sitio y la aplica al DOM (footer, marca, aviso general)

const API_CONFIG = '/api/configuracion';

// UTILIDADES

function escapar(texto) {
    if (texto === null || texto === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(texto);
    return div.innerHTML;
}

// valida que una url sea valida para mostrar como enlace externo
// solo acepta http://, https:// o rutas internas (que empiezan con /)
function urlValida(url) {
    if (!url) return false;
    const texto = String(url).trim();
    if (texto === '') return false;
    return /^(https?:\/\/|\/)/i.test(texto);
}

// APLICAR CONFIGURACION

function aplicarConfiguracion(config) {
    // marca: actualizar el nombre en el header y footer
    const marca = config.marca_nombre || 'DuotechBros';

    const navBrand = document.querySelector('.nav-brand');
    if (navBrand) {
        navBrand.textContent = marca;
    }

    const footerMarca = document.getElementById('footer-marca');
    if (footerMarca) {
        footerMarca.textContent = marca;
    }

    // actualizar todos los textos que tengan la clase texto-marca
    document.querySelectorAll('.texto-marca').forEach((el) => {
        el.textContent = marca;
    });

    // copy: actualizar el copyright con el nombre de la marca
    const footerCopy = document.getElementById('footer-copy');
    if (footerCopy) {
        const anio = new Date().getFullYear();
        footerCopy.textContent = `© ${anio} ${marca}. Todos los derechos reservados.`;
    }

    // redes sociales: construir el bloque solo con las que tengan URL
    const footerSocial = document.getElementById('footer-social');
    if (footerSocial) {
        const redes = [
            { url: config.redes_instagram, icono: 'fab fa-instagram', nombre: 'Instagram' },
            { url: config.redes_facebook, icono: 'fab fa-facebook-f', nombre: 'Facebook' },
            { url: config.redes_tiktok, icono: 'fab fa-tiktok', nombre: 'TikTok' },
        ];

        const links = redes
            .filter((r) => urlValida(r.url))
            .map(
                (r) => `
                <a href="${escapar(r.url)}" target="_blank" rel="noopener noreferrer" title="${r.nombre}" aria-label="${r.nombre}">
                    <i class="${r.icono}"></i>
                </a>
            `
            )
            .join('');

        if (links) {
            footerSocial.innerHTML = links;
            footerSocial.style.display = 'flex';
        } else {
            footerSocial.style.display = 'none';
        }
    }

    // links legales: construir solo los que tengan URL
    const footerLinks = document.getElementById('footer-links');
    if (footerLinks) {
        const legales = [
            { url: config.footer_terminos_url, texto: 'Términos y condiciones' },
            { url: config.footer_privacidad_url, texto: 'Política de privacidad' },
        ];

        const links = legales
            .filter((l) => urlValida(l.url))
            .map(
                (l) => `
                <a href="${escapar(l.url)}" target="_blank" rel="noopener noreferrer">
                    ${escapar(l.texto)}
                </a>
            `
            )
            .join('');

        if (links) {
            footerLinks.innerHTML = links;
            footerLinks.style.display = 'flex';
        } else {
            footerLinks.style.display = 'none';
        }
    }

    // aviso general: mostrar si esta cargado
    const avisoBloque = document.getElementById('aviso-general');
    const avisoTexto = document.getElementById('aviso-general-texto');
    if (avisoBloque && avisoTexto) {
        const aviso = (config.aviso_general || '').trim();
        if (aviso !== '') {
            avisoTexto.textContent = aviso;
            avisoBloque.style.display = 'flex';
        } else {
            avisoBloque.style.display = 'none';
        }
    }
}

// CARGA DE DATOS

async function cargarConfiguracion() {
    try {
        const respuesta = await fetch(API_CONFIG);
        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

        const config = await respuesta.json();
        aplicarConfiguracion(config);
    } catch (error) {
        // si falla, no rompemos la pagina: se mantienen los valores por defecto del HTML
        console.warn('No se pudo cargar la configuracion del sitio:', error.message);
    }
}

// INICIO

document.addEventListener('DOMContentLoaded', cargarConfiguracion);