// LOGICA DE LA TIENDA PUBLICA
// consume GET /api/productos, permite filtrar y buscar
// permite agregar productos al carrito si el usuario esta logueado

const API_PRODUCTOS = '/api/productos';
const API_CARRITO = '/api/usuarios/carrito';

const lista = document.getElementById('lista-productos');
const contador = document.getElementById('contador-productos');
const buscador = document.getElementById('buscador');
const filtrosContainer = document.getElementById('filtros-categorias');

const estadoCargando = document.getElementById('estado-cargando');
const estadoVacio = document.getElementById('estado-vacio');
const estadoSinResultados = document.getElementById('estado-sin-resultados');
const estadoError = document.getElementById('estado-error');

// estado local de la pagina
let productosOriginales = [];
let categoriaActiva = 'Todas';
let textoBusqueda = '';

// UTILIDADES

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
    if (s <= 3) return { clase: 'stock-bajo', texto: `Ultimas ${s} unidades` };
    return { clase: 'stock-disponible', texto: 'Disponible' };
}

// NOTIFICACIONES TOAST

function mostrarToast(mensaje, tipo = 'exito') {
    const anterior = document.getElementById('toast-publico');
    if (anterior) anterior.remove();

    const toast = document.createElement('div');
    toast.id = 'toast-publico';
    toast.className = `toast-publico toast-${tipo}`;
    toast.innerHTML = `<span>${mensaje}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('toast-visible'), 10);
    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// SESION DEL USUARIO

function estaLogueadoUsuario() {
    return (
        sessionStorage.getItem('usuarioLogueado') === 'true' &&
        !!sessionStorage.getItem('usuarioToken')
    );
}

function obtenerTokenUsuario() {
    return sessionStorage.getItem('usuarioToken') || '';
}

// FILTROS

function construirFiltros(productos) {
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
            filtrosContainer.querySelectorAll('.filtro-btn').forEach((b) => {
                b.classList.toggle('active', b.dataset.categoria === cat);
            });
            aplicarFiltros();
        });
        filtrosContainer.appendChild(btn);
    });
}

// RENDERIZADO

function renderizarProductos(productos) {
    lista.innerHTML = '';

    if (productos.length === 0) {
        contador.textContent = '0 productos';
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

        const sinStock = Number(p.stock) <= 0;
        const btnDisabled = sinStock ? 'disabled' : '';
        const btnTexto = sinStock ? 'Sin stock' : 'Agregar al carrito';
        const btnIcono = sinStock ? 'fa-ban' : 'fa-cart-plus';

        card.innerHTML = `
            <div class="product-imagen-wrapper">
                ${imagenHTML}
                ${categoriaBadge}
            </div>
            <div class="product-info">
                <h3 class="product-titulo">${escapar(p.nombre)}</h3>
                <p class="product-descripcion">${escapar(p.descripcion) || 'Sin descripcion.'}</p>
                <div class="product-footer">
                    <span class="product-precio">${formatearPrecio(p.precio)}</span>
                    ${stockBadge}
                </div>
                <button
                    type="button"
                    class="product-btn ${btnDisabled}"
                    data-producto-id="${p.id}"
                    ${btnDisabled}
                >
                    <i class="fas ${btnIcono}"></i> ${btnTexto}
                </button>
            </div>
        `;

        lista.appendChild(card);
    });

    // asignar evento a los botones "agregar al carrito"
    lista.querySelectorAll('.product-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const productoId = btn.dataset.productoId;
            agregarAlCarrito(productoId, btn);
        });
    });
}

// APLICAR FILTROS

function aplicarFiltros() {
    estadoVacio.style.display = 'none';
    estadoSinResultados.style.display = 'none';
    estadoError.style.display = 'none';

    let filtrados = productosOriginales;

    if (categoriaActiva !== 'Todas') {
        filtrados = filtrados.filter((p) => p.categoria === categoriaActiva);
    }

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

// AGREGAR AL CARRITO

async function agregarAlCarrito(productoId, btnElement) {
    // si no esta logueado, preguntar si quiere ingresar
    if (!estaLogueadoUsuario()) {
        const quiereIngresar = confirm(
            'Necesitas iniciar sesion para agregar productos al carrito.\n\nQueres ingresar ahora?'
        );
        if (quiereIngresar) {
            window.location.href = '/user/login.html';
        }
        return;
    }

    // deshabilitar el boton mientras se procesa
    const contenidoOriginal = btnElement.innerHTML;
    btnElement.disabled = true;
    btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Agregando...';

    try {
        const respuesta = await fetch(`${API_CARRITO}/agregar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${obtenerTokenUsuario()}`,
            },
            body: JSON.stringify({ producto_id: Number(productoId), cantidad: 1 }),
        });

        const resultado = await respuesta.json();

        if (respuesta.status === 401) {
            // token expirado o invalido
            sessionStorage.removeItem('usuarioLogueado');
            sessionStorage.removeItem('usuarioNombre');
            sessionStorage.removeItem('usuarioToken');
            mostrarToast('Tu sesion expiro. Volve a iniciar sesion.', 'error');
            setTimeout(() => {
                window.location.href = '/user/login.html';
            }, 1500);
            return;
        }

        if (resultado.success) {
            mostrarToast(resultado.message || 'Producto agregado al carrito.', 'exito');
            // avisar al header para que actualice el contador
            document.dispatchEvent(new CustomEvent('carritoActualizado'));
        } else {
            mostrarToast(resultado.error || 'No se pudo agregar al carrito.', 'error');
        }
    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        mostrarToast('No se pudo conectar con el servidor.', 'error');
    } finally {
        btnElement.disabled = false;
        btnElement.innerHTML = contenidoOriginal;
    }
}

// CARGA DE DATOS

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

// EVENTOS

buscador.addEventListener('input', (e) => {
    textoBusqueda = e.target.value;
    aplicarFiltros();
});

// INICIO

document.addEventListener('DOMContentLoaded', cargarProductos);