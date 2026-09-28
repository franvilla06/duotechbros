// LÓGICA DE LA TIENDA PÚBLICA 
// Consume GET /api/productos, permite filtrar y buscar

const API_PRODUCTOS = '/api/productos';

const lista = document.getElementById('lista-productos');
const contador = document.getElementById('contador-productos');
const buscador = document.getElementById('buscador');
const filtrosContainer = document.getElementById('filtros-categorias');

const estadoCargando = document.getElementById('estado-cargando');
const estadoVacio = document.getElementById('estado-vacio');
const estadoSinResultados = document.getElementById('estado-sin-resultados');
const estadoError = document.getElementById('estado-error');

// Estado local de la página
let productosOriginales = [];
let categoriaActiva = 'Todas';
let textoBusqueda = '';

// ----- UTILIDADES -----

function escapar(texto) {
    if (texto === null || texto === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(texto);
    return div.innerHTML;
}

function formatearPrecio(precio) {
    const num = Number(precio);
    if (isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
}

function claseStock(stock) {
    const s = Number(stock);
    if (s <= 0) return { clase: 'stock-agotado', texto: 'Sin stock' };
    if (s <= 3) return { clase: 'stock-bajo', texto: `Últimas ${s} unidades` };
    return { clase: 'stock-disponible', texto: 'Disponible' };
}

// ----- FILTROS -----

function construirFiltros(productos) {
    // Obtener categorías únicas
    const categorias = ['Todas'];
    productos.forEach((p) => {
        if (p.categoria && !categorias.includes(p.categoria)) {
            categorias.push(p.categoria);
        }
    });

    filtrosContainer.innerHTML = '';
    categorias.forEach((cat) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'filtro-btn' + (cat === categoriaActiva ? ' active' : '');
        btn.textContent = cat;
        btn.dataset.categoria = cat;
        btn.addEventListener('click', () => {
            categoriaActiva = cat;
            // Actualizar botones activos
            filtrosContainer.querySelectorAll('.filtro-btn').forEach((b) => {
                b.classList.toggle('active', b.dataset.categoria === cat);
            });
            aplicarFiltros();
        });
        filtrosContainer.appendChild(btn);
    });
}

// ----- RENDERIZADO -----

function renderizarProductos(productos) {
    lista.innerHTML = '';

    if (productos.length === 0) {
        contador.textContent = '0 productos';
        // Distinguir entre "sin resultados por filtro" y "base vacía"
        if (productosOriginales.length === 0) {
            estadoVacio.style.display = 'block';
        } else {
            estadoSinResultados.style.display = 'block';
        }
        return;
    }

    contador.textContent = `${productos.length} producto${productos.length !== 1 ? 's' : ''}`;

    productos.forEach((p) => {
        const card = document.createElement('article');
        card.className = 'product-card';

        const imagenHTML = p.imagen_url
            ? `<img
                 src="${escapar(p.imagen_url)}"
                 alt="${escapar(p.nombre)}"
                 class="product-imagen"
                 loading="lazy"
                 onerror="this.outerHTML='<div class=\\'product-imagen-placeholder\\'><i class=\\'fas fa-image\\'></i></div>'"
               />`
            : `<div class="product-imagen-placeholder"><i class="fas fa-image"></i></div>`;

        const categoriaBadge = p.categoria
            ? `<span class="product-badge-categoria">${escapar(p.categoria)}</span>`
            : '';

        const stockInfo = claseStock(p.stock);
        const stockBadge = `<span class="product-stock ${stockInfo.clase}">
            <i class="fas fa-circle"></i> ${stockInfo.texto}
        </span>`;

        const btnDisabled = Number(p.stock) <= 0 ? 'disabled' : '';
        const btnTexto = Number(p.stock) <= 0 ? 'Sin stock' : 'Consultar';

        card.innerHTML = `
            <div class="product-imagen-wrapper">
                ${imagenHTML}
                ${categoriaBadge}
            </div>
            <div class="product-info">
                <h3 class="product-titulo">${escapar(p.nombre)}</h3>
                <p class="product-descripcion">${escapar(p.descripcion) || 'Sin descripción.'}</p>
                <div class="product-footer">
                    <span class="product-precio">${formatearPrecio(p.precio)}</span>
                    ${stockBadge}
                </div>
                <a href="pedidos.html" class="product-btn ${btnDisabled}">
                    <i class="fas fa-comments"></i> ${btnTexto}
                </a>
            </div>
        `;

        lista.appendChild(card);
    });
}

// ----- APLICAR FILTROS -----

function aplicarFiltros() {
    // Ocultar todos los estados mientras se renderiza
    estadoVacio.style.display = 'none';
    estadoSinResultados.style.display = 'none';
    estadoError.style.display = 'none';

    let filtrados = productosOriginales;

    // Filtrar por categoría
    if (categoriaActiva !== 'Todas') {
        filtrados = filtrados.filter((p) => p.categoria === categoriaActiva);
    }

    // Filtrar por búsqueda (case-insensitive)
    if (textoBusqueda.trim() !== '') {
        const q = textoBusqueda.trim().toLowerCase();
        filtrados = filtrados.filter(
            (p) =>
                (p.nombre && p.nombre.toLowerCase().includes(q)) ||
                (p.descripcion && p.descripcion.toLowerCase().includes(q))
        );
    }

    renderizarProductos(filtrados);
}

// ----- CARGA DE DATOS -----

async function cargarProductos() {
    estadoCargando.style.display = 'block';
    estadoVacio.style.display = 'none';
    estadoSinResultados.style.display = 'none';
    estadoError.style.display = 'none';
    lista.innerHTML = '';

    try {
        const respuesta = await fetch(API_PRODUCTOS);
        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

        const productos = await respuesta.json();
        productosOriginales = productos;

        construirFiltros(productos);
        renderizarProductos(productos);
    } catch (error) {
        console.error('Error al cargar productos:', error);
        lista.innerHTML = '';
        estadoError.style.display = 'block';
        contador.textContent = '0 productos';
    } finally {
        estadoCargando.style.display = 'none';
    }
}

// ----- EVENTOS -----

buscador.addEventListener('input', (e) => {
    textoBusqueda = e.target.value;
    aplicarFiltros();
});

// ----- INICIO -----

document.addEventListener('DOMContentLoaded', cargarProductos);