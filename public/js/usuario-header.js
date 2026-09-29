// LOGICA DEL ICONO DE USUARIO EN EL HEADER
// se incluye en todas las paginas publicas
// tambien maneja el contador del carrito

const API_CARRITO_HEADER = '/api/usuarios/carrito';

// UTILIDADES DE SESION

function estaLogueadoUsuario() {
    return (
        sessionStorage.getItem('usuarioLogueado') === 'true' &&
        !!sessionStorage.getItem('usuarioToken')
    );
}

function obtenerUsuarioActual() {
    return sessionStorage.getItem('usuarioNombre') || '';
}

function obtenerTokenUsuario() {
    return sessionStorage.getItem('usuarioToken') || '';
}

function cerrarSesionUsuario() {
    sessionStorage.removeItem('usuarioLogueado');
    sessionStorage.removeItem('usuarioNombre');
    sessionStorage.removeItem('usuarioToken');
}

// CARRITO

// consulta el carrito y actualiza el badge del contador en el boton de usuario
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
            // token invalido, limpiar sesion y ocultar el badge
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
                <a href="/usuario/perfil.html" class="usuario-menu-item">
                    <i class="fas fa-user"></i> Mi perfil
                </a>
                <a href="/usuario/carrito.html" class="usuario-menu-item">
                    <i class="fas fa-shopping-cart"></i> Mi carrito
                    <span class="cart-count" id="cart-count-menu" style="display: none;">0</span>
                </a>
                <a href="/usuario/pedidos.html" class="usuario-menu-item">
                    <i class="fas fa-box"></i> Mis pedidos
                </a>
                <button type="button" class="usuario-menu-item cerrar-sesion" id="btn-cerrar-sesion">
                    <i class="fas fa-sign-out-alt"></i> Cerrar sesion
                </button>
            </div>
        `;

        // referencias despues de inyectar el html
        const btnMenu = document.getElementById('btn-menu-usuario');
        const menu = document.getElementById('menu-usuario');
        const btnCerrar = document.getElementById('btn-cerrar-sesion');

        // abrir o cerrar el menu al hacer click en el boton
        btnMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('visible');
        });

        // cerrar el menu al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!contenedor.contains(e.target)) {
                menu.classList.remove('visible');
            }
        });

        // cerrar el menu al presionar escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                menu.classList.remove('visible');
            }
        });

        // cerrar sesion
        btnCerrar.addEventListener('click', () => {
            if (confirm('Estas seguro de que queres cerrar sesion?')) {
                cerrarSesionUsuario();
                window.location.href = '/index.html';
            }
        });

        // actualizar el contador del carrito
        actualizarContadorCarrito();

        // escuchar el evento global de "carrito actualizado"
        document.addEventListener('carritoActualizado', actualizarContadorCarrito);

        // refrescar cada 60 segundos por las dudas
        setInterval(actualizarContadorCarrito, 60000);
    } else {
        contenedor.innerHTML = `
            <a href="/usuario/login.html" class="usuario-btn-header">
                <i class="fas fa-user-circle"></i> Ingresar
            </a>
        `;
    }
}

// INICIO

document.addEventListener('DOMContentLoaded', renderizarUsuarioHeader);