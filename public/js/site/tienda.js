// LOGICA DE LA TIENDA PUBLICA
// CONSUME GET /API/PRODUCTOS, PERMITE FILTRAR Y BUSCAR
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

// ESTADO LOCAL DE LA PAGINA
let productosOriginales = [];
let categoriaActiva = 'Todas';
let textoBusqueda = '';

// UTILIDADES

// escapa el texto para insertarlo de forma segura en HTML.
function escapar(texto) {
    if (texto === null || texto === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(texto);
    return div.innerHTML;
}

// formatea el precio como importe monetario.
function formatearPrecio(precio) {
    const num = Number(precio);
    if (isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
}

// elige la clase visual seg?n la disponibilidad del producto.
function claseStock(stock) {
    const s = Number(stock);
    if (s <= 0) return { clase: 'stock-agotado', texto: 'Sin stock' };
    if (s <= 3) return { clase: 'stock-bajo', texto: `Ultimas ${s} unidades` };
    return { clase: 'stock-disponible', texto: 'Disponible' };
}

// OBTIENE TODAS LAS IMAGENES DE UN PRODUCTO (principal + adicionales)
// obtiene las im?genes asociadas al producto.
function obtenerImagenesProducto(producto) {
    const urls = [];

    // IMAGEN PRINCIPAL
    if (producto.imagen_url && producto.imagen_url.trim() !== '') {
        urls.push(producto.imagen_url.trim());
    }

    // IMAGENES ADICIONALES (pueden venir como array o como json string)
    let adicionales = [];
    const campo = producto.imagenes;
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

// NOTIFICACIONES TOAST

// muestra una notificaci?n temporal con el mensaje indicado.
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

// indica si hay una sesi?n de usuario activa.
function estaLogueadoUsuario() {
    return (
        sessionStorage.getItem('usuarioLogueado') === 'true' &&
        !!sessionStorage.getItem('usuarioToken')
    );
}

// obtiene el token de autenticaci?n del usuario.
function obtenerTokenUsuario() {
    return sessionStorage.getItem('usuarioToken') || '';
}

// FILTROS

// crea los controles de filtro a partir de los productos disponibles.
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

// muestra los productos con sus datos y acciones disponibles.
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

        const imagenes = obtenerImagenesProducto(p);
        const imagenHTML = imagenes.length > 0
            ? construirCarruselHTML(imagenes, p.nombre)
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

    // ASIGNAR EVENTO A LOS BOTONES "AGREGAR AL CARRITO"
    lista.querySelectorAll('.product-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const productoId = btn.dataset.productoId;
            agregarAlCarrito(productoId, btn);
        });
    });

    // INICIALIZAR LOS CARRUSELES DE LAS TARJETAS RECIEN RENDERIZADAS
    inicializarCarruseles(lista);
}

// APLICAR FILTROS

// filtra los elementos seg?n los criterios seleccionados.
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

// agrega el producto seleccionado al carrito del usuario.
async function agregarAlCarrito(productoId, btnElement) {
    // SI NO ESTA LOGUEADO, PREGUNTAR SI QUIERE INGRESAR
    if (!estaLogueadoUsuario()) {
        const quiereIngresar = confirm(
            'Necesitas iniciar sesion para agregar productos al carrito.\n\nQueres ingresar ahora?'
        );
        if (quiereIngresar) {
            window.location.href = '/user/login.html';
        }
        return;
    }

    // DESHABILITAR EL BOTON MIENTRAS SE PROCESA
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
            // TOKEN EXPIRADO O INVALIDO
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
            // AVISAR AL HEADER PARA QUE ACTUALICE EL CONTADOR
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

// solicita los productos y actualiza la vista.
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