// ============================================================
// LÓGICA COMÚN DEL PANEL DE ADMINISTRACIÓN - DuotechBros
// ============================================================

const API_BASE = '/api';

// Intervalo de refresco de notificaciones (30 segundos)
const INTERVALO_NOTIFICACIONES = 30000;
let intervalNotificaciones = null;

// ============================================================
// UTILIDADES DE SESIÓN
// ============================================================

function guardarSesion(usuario, token) {
    sessionStorage.setItem('adminLogueado', 'true');
    sessionStorage.setItem('adminUsuario', usuario);
    sessionStorage.setItem('adminToken', token);
}

function estaLogueado() {
    return sessionStorage.getItem('adminLogueado') === 'true' && !!sessionStorage.getItem('adminToken');
}

function obtenerUsuario() {
    return sessionStorage.getItem('adminUsuario') || 'Admin';
}

function obtenerToken() {
    return sessionStorage.getItem('adminToken') || '';
}

function cerrarSesion() {
    sessionStorage.removeItem('adminLogueado');
    sessionStorage.removeItem('adminUsuario');
    sessionStorage.removeItem('adminToken');
    window.location.href = '/admin/login.html';
}

/**
 * fetch con autenticación: agrega automáticamente el header Authorization.
 */
async function fetchAdmin(url, opciones = {}) {
    const token = obtenerToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(opciones.headers || {}),
        Authorization: `Bearer ${token}`,
    };

    const respuesta = await fetch(url, { ...opciones, headers });

    if (respuesta.status === 401) {
        alert('Tu sesión expiró. Volvé a iniciar sesión.');
        cerrarSesion();
        throw new Error('No autorizado');
    }

    return respuesta;
}

// ============================================================
// NOTIFICACIONES DE PEDIDOS PENDIENTES
// ============================================================

/**
 * Inserta el badge de notificaciones en el link "Ver Pedidos" del sidebar.
 * Se llama una sola vez al cargar cada página.
 */
function insertarBadgeNotificacion() {
    // Buscar el link del sidebar que apunta a pedidos.html
    const linkPedidos = document.querySelector('.admin-nav a[href="pedidos.html"]');
    if (!linkPedidos) return;

    // Evitar insertar dos veces
    if (linkPedidos.querySelector('.notif-badge')) return;

    // Crear el badge (oculto por defecto)
    const badge = document.createElement('span');
    badge.className = 'notif-badge';
    badge.id = 'notif-badge';
    badge.style.display = 'none';
    badge.textContent = '0';

    linkPedidos.appendChild(badge);
}

/**
 * Consulta la cantidad de pedidos pendientes y actualiza el badge.
 */
async function actualizarNotificaciones() {
    const badge = document.getElementById('notif-badge');
    if (!badge) return;

    try {
        const respuesta = await fetch(`${API_BASE}/pedidos`);
        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

        const pedidos = await respuesta.json();

        // Contar solo los pendientes
        const pendientes = pedidos.filter(
            (p) => (p.estado || 'pendiente').toLowerCase().trim() === 'pendiente'
        ).length;

        if (pendientes > 0) {
            badge.textContent = pendientes > 99 ? '99+' : String(pendientes);
            badge.style.display = 'inline-flex';
            badge.title = `${pendientes} pedido${pendientes !== 1 ? 's' : ''} pendiente${pendientes !== 1 ? 's' : ''}`;
        } else {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.warn('No se pudieron cargar las notificaciones:', error.message);
        // No mostramos error al usuario porque es una notificación secundaria
    }
}

/**
 * Inicia el ciclo de actualización automática cada 30 segundos.
 */
function iniciarNotificaciones() {
    insertarBadgeNotificacion();
    actualizarNotificaciones();

    // Limpiar intervalo previo (por si acaso)
    if (intervalNotificaciones) clearInterval(intervalNotificaciones);
    intervalNotificaciones = setInterval(actualizarNotificaciones, INTERVALO_NOTIFICACIONES);
}

// ============================================================
// PROTECCIÓN DE PÁGINAS + INICIALIZACIÓN
// ============================================================

function protegerPagina() {
    if (!estaLogueado()) {
        window.location.href = '/admin/login.html';
        return;
    }

    // Nombre del usuario en el sidebar
    const nombreUsuario = document.getElementById('nombre-usuario');
    if (nombreUsuario) {
        nombreUsuario.textContent = obtenerUsuario();
    }

    // Configurar el botón de logout
    const botonLogout = document.getElementById('logout-btn');
    if (botonLogout) {
        botonLogout.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que querés cerrar sesión?')) {
                cerrarSesion();
            }
        });
    }

    // Iniciar las notificaciones (solo en páginas protegidas del panel)
    iniciarNotificaciones();
}

// ============================================================
// LÓGICA DE LOGIN
// ============================================================

const formLogin = document.getElementById('form-login');

if (formLogin) {
    const mensajeDiv = document.getElementById('login-mensaje');
    const boton = formLogin.querySelector('button[type="submit"]');

    // Si ya está logueado, redirige directo al dashboard
    if (estaLogueado()) {
        window.location.href = '/admin/dashboard.html';
    }

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();

        const usuario = document.getElementById('usuario').value.trim();
        const password = document.getElementById('password').value;

        if (!usuario || !password) {
            mostrarMensajeLogin('Por favor, completá todos los campos.', 'error');
            return;
        }

        boton.disabled = true;
        boton.textContent = 'Verificando...';

        try {
            const respuesta = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario, password }),
            });

            const resultado = await respuesta.json();

            if (resultado.success) {
                guardarSesion(resultado.usuario, resultado.token);
                mostrarMensajeLogin('✅ Acceso correcto. Redirigiendo...', 'exito');
                setTimeout(() => {
                    window.location.href = '/admin/dashboard.html';
                }, 800);
            } else {
                mostrarMensajeLogin(
                    `❌ ${resultado.error || 'Usuario o contraseña incorrectos.'}`,
                    'error'
                );
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            mostrarMensajeLogin(
                '❌ No se pudo conectar con el servidor. Verificá que esté corriendo.',
                'error'
            );
        } finally {
            boton.disabled = false;
            boton.textContent = 'Iniciar Sesión';
        }
    });

    function mostrarMensajeLogin(texto, tipo) {
        mensajeDiv.textContent = texto;
        mensajeDiv.className = `login-mensaje ${tipo}`;
    }
}

// ============================================================
// PROTECCIÓN AUTOMÁTICA DE PÁGINAS INTERNAS
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    if (document.body.dataset.adminProtected === 'true') {
        protegerPagina();
    }
});