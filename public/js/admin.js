// ============================================================
// LÓGICA COMÚN DEL PANEL DE ADMINISTRACIÓN - DuotechBros
// ============================================================

const API_BASE = '/api';

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
// ORDENAMIENTO DE TABLAS
// ============================================================

/**
 * Compara dos valores según el tipo especificado.
 * @returns -1, 0 o 1
 */
function compararValores(a, b, tipo) {
    // Valores nulos/indefinidos van al final
    if (a === null || a === undefined || a === '') return 1;
    if (b === null || b === undefined || b === '') return -1;

    if (tipo === 'numero') {
        return Number(a) - Number(b);
    }
    if (tipo === 'fecha') {
        return new Date(a).getTime() - new Date(b).getTime();
    }
    // string por defecto (con sensibilidad a acentos)
    return String(a).localeCompare(String(b), 'es', { sensitivity: 'base' });
}

/**
 * Actualiza los íconos de los th según el orden activo.
 */
function actualizarIconosOrden(tabla, campoActivo, direccion) {
    tabla.querySelectorAll('thead th').forEach((th) => {
        const icono = th.querySelector('.th-sort-icon');
        if (!icono) return;

        if (th.dataset.campo === campoActivo) {
            icono.className = `fas fa-sort-${direccion === 'asc' ? 'up' : 'down'} th-sort-icon th-sort-activo`;
            th.classList.add('activo');
        } else {
            icono.className = 'fas fa-sort th-sort-icon';
            th.classList.remove('activo');
        }
    });
}

/**
 * Configura las columnas ordenables de una tabla.
 * @param {string} tablaId - id del elemento <table>
 * @param {Object} mapaColumnas - { indice: { campo, tipo } }
 * @param {Function} getOrden - función que devuelve el objeto de orden actual
 * @param {Function} setOrden - función que recibe el nuevo objeto de orden
 * @param {Function} callbackReRender - función a llamar cuando cambia el orden
 */
function configurarColumnasOrdenables(tablaId, mapaColumnas, getOrden, setOrden, callbackReRender) {
    const tabla = document.getElementById(tablaId);
    if (!tabla) return;

    const ths = tabla.querySelectorAll('thead th');

    Object.entries(mapaColumnas).forEach(([indice, config]) => {
        const th = ths[indice];
        if (!th) return;

        // Marcar el th como ordenable y agregar el ícono si no existe
        th.classList.add('th-ordenable');
        th.dataset.campo = config.campo;
        th.dataset.tipo = config.tipo;

        if (!th.querySelector('.th-sort-icon')) {
            th.innerHTML = `${th.innerHTML} <i class="fas fa-sort th-sort-icon"></i>`;
        }

        // Listener de clic
        th.addEventListener('click', () => {
            const orden = getOrden();

            if (orden.campo === config.campo) {
                // Alternar dirección
                orden.direccion = orden.direccion === 'asc' ? 'desc' : 'asc';
            } else {
                // Nueva columna → empezar ascendente
                orden.campo = config.campo;
                orden.tipo = config.tipo;
                orden.direccion = 'asc';
            }

            setOrden(orden);
            actualizarIconosOrden(tabla, orden.campo, orden.direccion);
            callbackReRender();
        });
    });
}

// ============================================================
// NOTIFICACIONES DE PEDIDOS PENDIENTES
// ============================================================

function insertarBadgeNotificacion() {
    const linkPedidos = document.querySelector('.admin-nav a[href="pedidos.html"]');
    if (!linkPedidos) return;
    if (linkPedidos.querySelector('.notif-badge')) return;

    const badge = document.createElement('span');
    badge.className = 'notif-badge';
    badge.id = 'notif-badge';
    badge.style.display = 'none';
    badge.textContent = '0';

    linkPedidos.appendChild(badge);
}

async function actualizarNotificaciones() {
    const badge = document.getElementById('notif-badge');
    if (!badge) return;

    try {
        const respuesta = await fetch(`${API_BASE}/pedidos`);
        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

        const pedidos = await respuesta.json();

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
    }
}

function iniciarNotificaciones() {
    insertarBadgeNotificacion();
    actualizarNotificaciones();

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

    const nombreUsuario = document.getElementById('nombre-usuario');
    if (nombreUsuario) {
        nombreUsuario.textContent = obtenerUsuario();
    }

    const botonLogout = document.getElementById('logout-btn');
    if (botonLogout) {
        botonLogout.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que querés cerrar sesión?')) {
                cerrarSesion();
            }
        });
    }

    iniciarNotificaciones();
}

// ============================================================
// LÓGICA DE LOGIN
// ============================================================

const formLogin = document.getElementById('form-login');

if (formLogin) {
    const mensajeDiv = document.getElementById('login-mensaje');
    const boton = formLogin.querySelector('button[type="submit"]');

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