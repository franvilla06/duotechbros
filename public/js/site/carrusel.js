// CARRUSEL DE IMAGENES REUTILIZABLE
// se usa en la tienda y en el portafolio del sitio publico
// si hay una sola imagen, se muestra sin flechas ni puntitos
// SI HAY VARIAS, SE MUESTRAN FLECHAS (al hover)

// escapa el texto para insertarlo de forma segura en un atributo HTML.
function escaparAtributo(texto) {
    if (texto === null || texto === undefined) return '';
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// construye el html de un carrusel a partir de un array de urls
// IMAGENES: ARRAY DE URLS (puede venir vacio)
// genera el marcado del carrusel con las im?genes recibidas.
function construirCarruselHTML(imagenes, alt = 'Imagen') {
    const urls = (imagenes || [])
        .filter((url) => typeof url === 'string' && url.trim() !== '')
        .map((url) => url.trim());

    // sin imagenes: devolvemos string vacio para que el llamador use su placeholder
    if (urls.length === 0) return '';

    // UNA SOLA IMAGEN: SIN FLECHAS NI PUNTITOS
    if (urls.length === 1) {
        return `
            <div class="carrusel carrusel-simple">
                <div class="carrusel-imagenes">
                    <img
                        src="${escaparAtributo(urls[0])}"
                        alt="${escaparAtributo(alt)}"
                        class="carrusel-imagen active"
                        loading="lazy"
                    />
                </div>
            </div>
        `;
    }

    // varias imagenes: flechas + puntitos
    const imagenesHTML = urls
        .map(
            (url, i) => `
            <img
                src="${escaparAtributo(url)}"
                alt="${escaparAtributo(alt)} ${i + 1}"
                class="carrusel-imagen${i === 0 ? ' active' : ''}"
                loading="lazy"
                data-index="${i}"
            />
        `
        )
        .join('');

    const puntosHTML = urls
        .map(
            (_, i) => `
            <button
                type="button"
                class="carrusel-punto${i === 0 ? ' active' : ''}"
                data-index="${i}"
                aria-label="Ir a la imagen ${i + 1}"
            ></button>
        `
        )
        .join('');

    return `
        <div class="carrusel" data-carrusel data-total="${urls.length}">
            <div class="carrusel-imagenes">
                ${imagenesHTML}
            </div>
            <button
                type="button"
                class="carrusel-flecha carrusel-prev"
                aria-label="Imagen anterior"
                title="Anterior"
            >
                <i class="fas fa-chevron-left"></i>
            </button>
            <button
                type="button"
                class="carrusel-flecha carrusel-next"
                aria-label="Imagen siguiente"
                title="Siguiente"
            >
                <i class="fas fa-chevron-right"></i>
            </button>
            <div class="carrusel-puntos">
                ${puntosHTML}
            </div>
        </div>
    `;
}

// configura los controles y el estado inicial del carrusel.
function inicializarCarrusel(carrusel) {
    // EVITAR DOBLE INICIALIZACION
    if (carrusel.dataset.carruselInicializado === 'true') return;
    carrusel.dataset.carruselInicializado = 'true';

    const imagenes = carrusel.querySelectorAll('.carrusel-imagen');
    const puntos = carrusel.querySelectorAll('.carrusel-punto');
    const btnPrev = carrusel.querySelector('.carrusel-prev');
    const btnNext = carrusel.querySelector('.carrusel-next');

    // si no hay flechas, es un carrusel simple (1 sola imagen), no hace nada
    if (imagenes.length <= 1 || !btnPrev || !btnNext) return;

    let indiceActual = 0;

    // actualiza la imagen visible en el carrusel.
    function mostrarImagen(nuevoIndice) {
        // LOOP CIRCULAR
        indiceActual = (nuevoIndice + imagenes.length) % imagenes.length;

        imagenes.forEach((img, i) => {
            img.classList.toggle('active', i === indiceActual);
        });

        puntos.forEach((punto, i) => {
            punto.classList.toggle('active', i === indiceActual);
        });
    }

    btnPrev.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        mostrarImagen(indiceActual - 1);
    });

    btnNext.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        mostrarImagen(indiceActual + 1);
    });

    puntos.forEach((punto, i) => {
        punto.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            mostrarImagen(i);
        });
    });
}

// INICIALIZA TODOS LOS CARRUSELES DENTRO DE UN CONTENEDOR
// inicializa los carruseles encontrados en la p?gina.
function inicializarCarruseles(raiz = document) {
    raiz.querySelectorAll('[data-carrusel]').forEach(inicializarCarrusel);
}
