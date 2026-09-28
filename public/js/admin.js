// LÓGICA COMÚN DEL PANEL DE ADMINISTRACIÓN - DUOTECHBROS

const API_BASE = '/api';

const INTERVALO_NOTIFICACIONES = 30000;
let intervalNotificaciones = null;

// UTILIDADES DE SESIÓN

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

// ORDENAMIENTO DE TABLAS

function compararValores(a, b, tipo) {
    if (a === null || a === undefined || a === '') return 1;
    if (b === null || b === undefined || b === '') return -1;

    if (tipo === 'numero') return Number(a) - Number(b);
    if (tipo === 'fecha') return new Date(a).getTime() - new Date(b).getTime();
    return String(a).localeCompare(String(b), 'es', { sensitivity: 'base' });
}

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

function configurarColumnasOrdenables(tablaId, mapaColumnas, getOrden, setOrden, callbackReRender) {
    const tabla = document.getElementById(tablaId);
    if (!tabla) return;

    const ths = tabla.querySelectorAll('thead th');

    Object.entries(mapaColumnas).forEach(([indice, config]) => {
        const th = ths[indice];
        if (!th) return;

        th.classList.add('th-ordenable');
        th.dataset.campo = config.campo;
        th.dataset.tipo = config.tipo;

        if (!th.querySelector('.th-sort-icon')) {
            th.innerHTML = `${th.innerHTML} <i class="fas fa-sort th-sort-icon"></i>`;
        }

        th.addEventListener('click', () => {
            const orden = getOrden();

            if (orden.campo === config.campo) {
                orden.direccion = orden.direccion === 'asc' ? 'desc' : 'asc';
            } else {
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

// PAGINACIÓN

/**
 * crea un paginador con estado propio.
 * @param {string} contenedorId - id del div donde se dibujan los controles.
 * @param {number} porPagina - cantidad de items por página.
 * @param {Function} onCambiarPagina - callback que se ejecuta al cambiar de página.
 * @returns objeto con métodos para actualizar el total, resetear, y paginar.
 */
function crearPaginador(contenedorId, porPagina, onCambiarPagina) {
    let paginaActual = 1;
    let totalItems = 0;

    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return null;

    function getTotalPaginas() {
        return Math.max(1, Math.ceil(totalItems / porPagina));
    }

    /**
    * genera la lista de botones a mostrar con elipsis si hay muchas páginas.
     */
    function generarBotones(pag) {
        const total = getTotalPaginas();
        const botones = [];

        if (total <= 7) {
            for (let i = 1; i <= total; i++) botones.push(i);
        } else {
            botones.push(1);
            let inicio = Math.max(2, pag - 1);
            let fin = Math.min(total - 1, pag + 1);
            if (pag <= 3) fin = 4;
            if (pag >= total - 2) inicio = total - 3;

            if (inicio > 2) botones.push('...');
            for (let i = inicio; i <= fin; i++) botones.push(i);
            if (fin < total - 1) botones.push('...');
            botones.push(total);
        }
        return botones;
    }

    function render() {
        const totalPags = getTotalPaginas();

        if (totalItems === 0 || totalPags <= 1) {
            contenedor.innerHTML = '';
            contenedor.style.display = 'none';
            return;
        }

        contenedor.style.display = 'flex';

        const inicio = (paginaActual - 1) * porPagina + 1;
        const fin = Math.min(paginaActual * porPagina, totalItems);

        const botones = generarBotones(paginaActual);
        const botonesHTML = botones
            .map((b) => {
                if (b === '...') return '<span class="pag-ellipsis">…</span>';
                const activo = b === paginaActual ? 'active' : '';
                return `<button class="pag-num ${activo}" data-pagina="${b}">${b}</button>`;
            })
            .join('');

        contenedor.innerHTML = `
            <div class="paginacion-info">
                Mostrando <strong>${inicio}–${fin}</strong> de <strong>${totalItems}</strong>
            </div>
            <div class="paginacion-controles">
                <button class="pag-btn pag-prev" ${paginaActual === 1 ? 'disabled' : ''} title="Anterior">
                    <i class="fas fa-chevron-left"></i>
                </button>
                ${botonesHTML}
                <button class="pag-btn pag-next" ${paginaActual === totalPags ? 'disabled' : ''} title="Siguiente">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;

        // NÚMEROS DE PÁGINA
        contenedor.querySelectorAll('.pag-num').forEach((btn) => {
            btn.addEventListener('click', () => {
                const num = parseInt(btn.dataset.pagina);
                if (num !== paginaActual) {
                    paginaActual = num;
                    render();
                    onCambiarPagina();
                }
            });
        });

        // BOTONES PREV/NEXT
        const btnPrev = contenedor.querySelector('.pag-prev');
        const btnNext = contenedor.querySelector('.pag-next');

        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                if (paginaActual > 1) {
                    paginaActual--;
                    render();
                    onCambiarPagina();
                }
            });
        }

        if (btnNext) {
            btnNext.addEventListener('click', () => {
                if (paginaActual < totalPags) {
                    paginaActual++;
                    render();
                    onCambiarPagina();
                }
            });
        }
    }

    return {
        /** actualiza el total de items. si resetPagina=true, vuelve a la página 1. */
        actualizar(nuevoTotal, resetPagina = false) {
            totalItems = nuevoTotal;
            if (resetPagina) paginaActual = 1;

            const totalPags = getTotalPaginas();
            if (paginaActual > totalPags) paginaActual = totalPags;
            if (paginaActual < 1) paginaActual = 1;

            render();
        },
        /** devuelve el slice de items correspondiente a la página actual. */
        getItems(items) {
            return items.slice((paginaActual - 1) * porPagina, paginaActual * porPagina);
        },
        /** devuelve la página actual. */
        getPaginaActual() {
            return paginaActual;
        },
    };
}

// NOTIFICACIONES DE PEDIDOS PENDIENTES

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

// PROTECCIÓN DE PÁGINAS + INICIALIZACIÓN

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

// LÓGICA DE LOGIN

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
                mostrarMensajeLogin('Acceso correcto. Redirigiendo...', 'exito');
                setTimeout(() => {
                    window.location.href = '/admin/dashboard.html';
                }, 800);
            } else {
                mostrarMensajeLogin(
                    `${resultado.error || 'Usuario o contraseña incorrectos.'}`,
                    'error'
                );
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            mostrarMensajeLogin(
                'No se pudo conectar con el servidor. Verificá que esté corriendo.',
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

// PROTECCIÓN AUTOMÁTICA DE PÁGINAS INTERNAS

document.addEventListener('DOMContentLoaded', () => {
    if (document.body.dataset.adminProtected === 'true') {
        protegerPagina();
    }
});