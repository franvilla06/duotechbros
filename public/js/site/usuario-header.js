// LOGICA DEL ICONO DE USUARIO EN EL HEADER
// SE INCLUYE EN TODAS LAS PAGINAS PUBLICAS
// TAMBIEN MANEJA EL CONTADOR DEL CARRITO

const API_CARRITO_HEADER = '/api/usuarios/carrito';

// UTILIDADES DE SESION

// indica si hay una sesi?n de usuario activa.
function estaLogueadoUsuario() {
    return (
        sessionStorage.getItem('usuarioLogueado') === 'true' &&
        !!sessionStorage.getItem('usuarioToken')
    );
}

// obtiene los datos del usuario guardados en la sesi?n.
function obtenerUsuarioActual() {
    return sessionStorage.getItem('usuarioNombre') || '';
}

// obtiene el token de autenticaci?n del usuario.
function obtenerTokenUsuario() {
    return sessionStorage.getItem('usuarioToken') || '';
}

// elimina los datos de sesi?n del usuario.
function cerrarSesionUsuario() {
    sessionStorage.removeItem('usuarioLogueado');
    sessionStorage.removeItem('usuarioNombre');
    sessionStorage.removeItem('usuarioToken');
}

// CARRITO

// actualiza el contador de productos del carrito.
async function actualizarContadorCarrito() {
    const badge = document.getElementById('cart-count');
    if (!badge) return;

    if (!estaLogueadoUsuario()) {
        badge.style.display = 'none';
        return;
    }

    try {
        const respuesta = await fetch(API_CARRITO_HEADER, {
            headers: {
                Authorization: `Bearer ${obtenerTokenUsuario()}`,
            },
        });

        if (respuesta.status === 401) {
            // TOKEN INVALIDO, LIMPIAR SESION Y OCULTAR EL BADGE
            cerrarSesionUsuario();
            badge.style.display = 'none';
            return;
        }

        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

        const data = await respuesta.json();
        const total = data.resumen ? data.resumen.total_unidades : 0;

        if (total > 0) {
            badge.textContent = total > 99 ? '99+' : String(total);
            badge.style.display = 'inline-flex';
            badge.title = `${total} item${total !== 1 ? 's' : ''} en el carrito`;
        } else {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.warn('No se pudo actualizar el contador del carrito:', error.message);
        badge.style.display = 'none';
    }
}

// RENDERIZADO DEL HEADER

// muestra en el encabezado las opciones de la sesi?n actual.
function renderizarUsuarioHeader() {
    const contenedor = document.getElementById('nav-usuario');
    if (!contenedor) return;

    if (estaLogueadoUsuario()) {
        const usuario = obtenerUsuarioActual();
        contenedor.innerHTML = `
            <button type="button" class="usuario-btn-header" id="btn-menu-usuario">
                <i class="fas fa-user-circle"></i>
                <span>Hola, ${usuario}</span>
                <span class="cart-count" id="cart-count" style="display: none;">0</span>
            </button>
            <div class="usuario-menu" id="menu-usuario">
                <div class="usuario-menu-header">
                    <small>Sesion activa</small>
                    <strong>${usuario}</strong>
                </div>
                <a href="/user/perfil.html" class="usuario-menu-item">
                    <i class="fas fa-user"></i> Mi perfil
                </a>
                <a href="/user/carrito.html" class="usuario-menu-item">
                    <i class="fas fa-shopping-cart"></i> Mi carrito
                    <span class="cart-count" id="cart-count-menu" style="display: none;">0</span>
                </a>
                <a href="/user/pedidos.html" class="usuario-menu-item">
                    <i class="fas fa-box"></i> Mis pedidos
                </a>
                <button type="button" class="usuario-menu-item cerrar-sesion" id="btn-cerrar-sesion">
                    <i class="fas fa-sign-out-alt"></i> Cerrar sesion
                </button>
            </div>
        `;

        // REFERENCIAS DESPUES DE INYECTAR EL HTML
        const btnMenu = document.getElementById('btn-menu-usuario');
        const menu = document.getElementById('menu-usuario');
        const btnCerrar = document.getElementById('btn-cerrar-sesion');

        // abrir o cerrar el menu al hacer click en el boton
        btnMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('visible');
        });

        // CERRAR EL MENU AL HACER CLICK FUERA
        document.addEventListener('click', (e) => {
            if (!contenedor.contains(e.target)) {
                menu.classList.remove('visible');
            }
        });

        // CERRAR EL MENU AL PRESIONAR ESCAPE
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                menu.classList.remove('visible');
            }
        });

        // CERRAR SESION
        btnCerrar.addEventListener('click', () => {
            if (confirm('Estas seguro de que queres cerrar sesion?')) {
                cerrarSesionUsuario();
                window.location.href = '/index.html';
            }
        });

        // ACTUALIZAR EL CONTADOR DEL CARRITO
        actualizarContadorCarrito();

        // ESCUCHAR EL EVENTO GLOBAL DE "CARRITO ACTUALIZADO"
        document.addEventListener('carritoActualizado', actualizarContadorCarrito);

        // refrescar cada 60 segundos por las dudas
        setInterval(actualizarContadorCarrito, 60000);
    } else {
        contenedor.innerHTML = `
            <a href="/user/login.html" class="usuario-btn-header">
                <i class="fas fa-user-circle"></i> Ingresar
            </a>
        `;
    }
}

// INICIO

document.addEventListener('DOMContentLoaded', renderizarUsuarioHeader);