// LOGICA DEL PORTAFOLIO PUBLICO - DUOTECHBROS
// CONSUME GET /API/PORTAFOLIO Y RENDERIZA LAS TARJETAS

const API_PORTAFOLIO = '/api/portafolio';

const lista = document.getElementById('lista-trabajos');
const contador = document.getElementById('contador-trabajos');
const estadoCargando = document.getElementById('estado-cargando');
const estadoVacio = document.getElementById('estado-vacio');
const estadoError = document.getElementById('estado-error');

// UTILIDADES

// escapa el texto para insertarlo de forma segura en HTML.
function escapar(texto) {
    if (texto === null || texto === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(texto);
    return div.innerHTML;
}

// convierte la fecha al formato de mes y a?o.
function formatearMesAnio(fechaISO) {
    if (!fechaISO) return '';
    const fecha = new Date(fechaISO.replace(' ', 'T'));
    if (isNaN(fecha)) return fechaISO;

    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    return `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
}

// convierte la fecha al formato corto utilizado en la interfaz.
function formatearFechaCorta(fechaISO) {
    if (!fechaISO) return '';
    const fecha = new Date(fechaISO.replace(' ', 'T'));
    if (isNaN(fecha)) return fechaISO;

    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
}

// elige la clase del distintivo seg?n el tipo de trabajo.
function claseTipoBadge(tipo) {
    if (!tipo) return 'tipo-default';
    const t = tipo.toLowerCase();
    if (t.includes('pantalla') || t.includes('display')) return 'tipo-pantalla';
    if (t.includes('bater')) return 'tipo-bateria';
    if (t.includes('placa')) return 'tipo-placa';
    if (t.includes('software') || t.includes('dato')) return 'tipo-software';
    if (t.includes('carga') || t.includes('módulo')) return 'tipo-carga';
    if (t.includes('cámara') || t.includes('camara')) return 'tipo-camara';
    return 'tipo-default';
}

// OBTIENE TODAS LAS IMAGENES DE UN TRABAJO (principal + adicionales)
// obtiene las im?genes asociadas al trabajo.
function obtenerImagenesTrabajo(trabajo) {
    const urls = [];

    if (trabajo.imagen_url && trabajo.imagen_url.trim() !== '') {
        urls.push(trabajo.imagen_url.trim());
    }

    let adicionales = [];
    const campo = trabajo.imagenes;
    if (Array.isArray(campo)) {
        adicionales = campo;
    } else if (typeof campo === 'string' && campo.trim() !== '') {
        try {
            const parseado = JSON.parse(campo);
            if (Array.isArray(parseado)) adicionales = parseado;
        } catch (error) {
            console.warn('No se pudieron leer las imagenes adicionales:', error.message);
        }
    }

    adicionales.forEach((url) => {
        if (typeof url === 'string' && url.trim() !== '') {
            urls.push(url.trim());
        }
    });

    return urls;
}

// genera el texto con las fechas del trabajo.
function generarTextoFechas(trabajo) {
    const inicio = trabajo.fecha_inicio;
    const fin = trabajo.fecha_fin;

    if (inicio && fin) {
        return `<i class="fas fa-calendar-check"></i>
                <span>${formatearFechaCorta(inicio)} — ${formatearFechaCorta(fin)}</span>`;
    }
    if (inicio) {
        return `<i class="fas fa-calendar-alt"></i>
                <span>Iniciado el ${formatearFechaCorta(inicio)}</span>`;
    }
    if (fin) {
        return `<i class="fas fa-calendar-check"></i>
                <span>Finalizado el ${formatearFechaCorta(fin)}</span>`;
    }
    // FALLBACK: USAR LA FECHA DE PUBLICACION
    if (trabajo.fecha) {
        return `<i class="fas fa-calendar-alt"></i>
                <span>${formatearMesAnio(trabajo.fecha)}</span>`;
    }
    return '';
}

// RENDERIZADO

// muestra los trabajos en la lista del portafolio.
function renderizarTrabajos(trabajos) {
    lista.innerHTML = '';

    if (!trabajos || trabajos.length === 0) {
        estadoVacio.style.display = 'block';
        contador.textContent = '0 trabajos';
        return;
    }

    estadoVacio.style.display = 'none';
    contador.textContent = `${trabajos.length} trabajo${trabajos.length !== 1 ? 's' : ''}`;

    trabajos.forEach((t) => {
        const card = document.createElement('article');
        card.className = 'project-card';

        const imagenes = obtenerImagenesTrabajo(t);
        const imagenHTML = imagenes.length > 0
            ? construirCarruselHTML(imagenes, t.titulo)
            : `<div class="project-imagen-placeholder"><i class="fas fa-image"></i></div>`;

        const tipoBadge = t.tipo_reparacion
            ? `<span class="project-badge ${claseTipoBadge(t.tipo_reparacion)}">
                 <i class="fas fa-tools"></i> ${escapar(t.tipo_reparacion)}
               </span>`
            : '';

        const textoFechas = generarTextoFechas(t);
        const fechasHTML = textoFechas
            ? `<span class="project-fecha">${textoFechas}</span>`
            : '';

        card.innerHTML = `
            <div class="project-imagen-wrapper">
                ${imagenHTML}
                ${tipoBadge}
            </div>
            <div class="project-info">
                <h3 class="project-titulo">${escapar(t.titulo)}</h3>
                <p class="project-descripcion">${escapar(t.descripcion) || 'Sin descripción.'}</p>
                ${fechasHTML}
            </div>
        `;

        lista.appendChild(card);
    });

    // INICIALIZAR LOS CARRUSELES DE LAS TARJETAS RECIEN RENDERIZADAS
    inicializarCarruseles(lista);
}

// CARGA DE DATOS

// solicita los trabajos y actualiza el portafolio.
async function cargarPortafolio() {
    estadoCargando.style.display = 'block';
    estadoVacio.style.display = 'none';
    estadoError.style.display = 'none';
    lista.innerHTML = '';

    try {
        const respuesta = await fetch(API_PORTAFOLIO);
        if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);

        const trabajos = await respuesta.json();
        renderizarTrabajos(trabajos);
    } catch (error) {
        console.error('Error al cargar portafolio:', error);
        lista.innerHTML = '';
        estadoError.style.display = 'block';
        contador.textContent = '0 trabajos';
    } finally {
        estadoCargando.style.display = 'none';
    }
}

// INICIO

document.addEventListener('DOMContentLoaded', cargarPortafolio);