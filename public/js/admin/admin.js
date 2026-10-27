// LOGICA COMUN DEL PANEL DE ADMINISTRACION - DUOTECHBROS

const API_BASE = '/api';

const INTERVALO_NOTIFICACIONES = 30000;
let intervalNotificaciones = null;

// UTILIDADES DE SESION

// guarda los datos de sesi?n administrativa en el almacenamiento local.
function guardarSesion(usuario, token) {
    sessionStorage.setItem('adminLogueado', 'true');
    sessionStorage.setItem('adminUsuario', usuario);
    sessionStorage.setItem('adminToken', token);
}

// indica si hay una sesi?n administrativa activa.
function estaLogueado() {
    return sessionStorage.getItem('adminLogueado') === 'true' && !!sessionStorage.getItem('adminToken');
}

// obtiene el nombre del usuario administrativo de la sesi?n.
function obtenerUsuario() {
    return sessionStorage.getItem('adminUsuario') || 'Admin';
}

// obtiene el token de autenticaci?n almacenado.
function obtenerToken() {
    return sessionStorage.getItem('adminToken') || '';
}

// elimina los datos de sesi?n y redirige al inicio de sesi?n.
function cerrarSesion() {
    sessionStorage.removeItem('adminLogueado');
    sessionStorage.removeItem('adminUsuario');
    sessionStorage.removeItem('adminToken');
    window.location.href = '/admin/login.html';
}

// realiza solicitudes a la API con la sesi?n administrativa.
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

// compara dos valores seg?n el tipo de dato indicado.
function compararValores(a, b, tipo) {
    if (a === null || a === undefined || a === '') return 1;
    if (b === null || b === undefined || b === '') return -1;

    if (tipo === 'numero') return Number(a) - Number(b);
    if (tipo === 'fecha') return new Date(a).getTime() - new Date(b).getTime();
    return String(a).localeCompare(String(b), 'es', { sensitivity: 'base' });
}

// actualiza los iconos que indican el orden de la tabla.
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

// habilita el ordenamiento en las columnas configuradas.
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

// PAGINACION

// crea los controles para recorrer los resultados por p?ginas.
function crearPaginador(contenedorId, porPagina, onCambiarPagina) {
    let paginaActual = 1;
    let totalItems = 0;

    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return null;

    // calcula el total de p?ginas seg?n el tama?o configurado.
    function getTotalPaginas() {
        return Math.max(1, Math.ceil(totalItems / porPagina));
    }

    // calcula los n?meros de p?gina que se mostrar?n.
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

    // actualiza la vista del paginador seg?n su estado actual.
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
        actualizar(nuevoTotal, resetPagina = false) {
            totalItems = nuevoTotal;
            if (resetPagina) paginaActual = 1;

            const totalPags = getTotalPaginas();
            if (paginaActual > totalPags) paginaActual = totalPags;
            if (paginaActual < 1) paginaActual = 1;

            render();
        },
        getItems(items) {
            return items.slice((paginaActual - 1) * porPagina, paginaActual * porPagina);
        },
        getPaginaActual() {
            return paginaActual;
        },
    };
}

// NOTIFICACIONES DE PEDIDOS PENDIENTES
// inserta dos badges: uno en reparaciones y otro en compras del sidebar

// prepara la insignia de notificaci?n para el elemento indicado.
function configurarBadge(tipo) {
    // TIPO PUEDE SER "REPARACION" O "PRODUCTO"
    const href = tipo === 'reparacion' ? 'pedidos.html' : 'compras.html';
    const badgeId = `notif-badge-${tipo}`;

    const link = document.querySelector(`.admin-nav a[href="${href}"]`);
    if (!link) return;

    // EVITAR DUPLICADOS
    if (link.querySelector('.notif-badge')) return;

    const badge = document.createElement('span');
    badge.className = 'notif-badge';
    badge.id = badgeId;
    badge.style.display = 'none';
    badge.textContent = '0';

    link.appendChild(badge);
}

// muestra las insignias de notificaciones pendientes.
function insertarBadgesNotificacion() {
    configurarBadge('reparacion');
    configurarBadge('producto');
}

// actualiza las notificaciones pendientes del panel.
async function actualizarNotificaciones() {
    const badgeReparacion = document.getElementById('notif-badge-reparacion');
    const badgeProducto = document.getElementById('notif-badge-producto');

    // si ninguna pagina tiene los badges, no hace nada
    if (!badgeReparacion && !badgeProducto) return;

    try {
        const respuesta = await fetchAdmin(`${API_BASE}/pedidos`);
        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

        const pedidos = await respuesta.json();

        // CONTAR PENDIENTES POR TIPO
        let pendientesReparacion = 0;
        let pendientesProducto = 0;

        pedidos.forEach((p) => {
            const estado = (p.estado || 'pendiente').toLowerCase().trim();
            if (estado !== 'pendiente') return;

            const tipo = p.tipo || 'reparacion';
            if (tipo === 'reparacion') {
                pendientesReparacion++;
            } else if (tipo === 'producto') {
                pendientesProducto++;
            }
        });

        // ACTUALIZAR BADGE DE REPARACIONES
        if (badgeReparacion) {
            if (pendientesReparacion > 0) {
                badgeReparacion.textContent = pendientesReparacion > 99 ? '99+' : String(pendientesReparacion);
                badgeReparacion.style.display = 'inline-flex';
                badgeReparacion.title = `${pendientesReparacion} reparacion${pendientesReparacion !== 1 ? 'es' : ''} pendiente${pendientesReparacion !== 1 ? 's' : ''}`;
            } else {
                badgeReparacion.style.display = 'none';
            }
        }

        // ACTUALIZAR BADGE DE COMPRAS
        if (badgeProducto) {
            if (pendientesProducto > 0) {
                badgeProducto.textContent = pendientesProducto > 99 ? '99+' : String(pendientesProducto);
                badgeProducto.style.display = 'inline-flex';
                badgeProducto.title = `${pendientesProducto} compra${pendientesProducto !== 1 ? 's' : ''} pendiente${pendientesProducto !== 1 ? 's' : ''}`;
            } else {
                badgeProducto.style.display = 'none';
            }
        }
    } catch (error) {
        console.warn('No se pudieron cargar las notificaciones:', error.message);
    }
}

// programa la actualizaci?n peri?dica de notificaciones.
function iniciarNotificaciones() {
    insertarBadgesNotificacion();
    actualizarNotificaciones();

    if (intervalNotificaciones) clearInterval(intervalNotificaciones);
    intervalNotificaciones = setInterval(actualizarNotificaciones, INTERVALO_NOTIFICACIONES);
}

window.pausarNotificaciones = () => {
    if (intervalNotificaciones) {
        clearInterval(intervalNotificaciones);
        intervalNotificaciones = null;
    }
};

// PROTECCION DE PAGINAS + INICIALIZACION

// redirige al inicio de sesi?n si no hay una sesi?n v?lida.
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

// LOGICA DE LOGIN

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

    // muestra el mensaje correspondiente en el formulario de acceso.
    function mostrarMensajeLogin(texto, tipo) {
        mensajeDiv.textContent = texto;
        mensajeDiv.className = `login-mensaje ${tipo}`;
    }
}

// MENU HAMBURGUESA DEL SIDEBAR (mobile)

// configura los controles del men? para pantallas peque?as.
function iniciarMenuMobile() {
    const sidebar = document.querySelector('.admin-sidebar');
    const header = document.querySelector('.admin-header');

    if (!sidebar || !header) return;
    if (document.getElementById('admin-menu-toggle')) return;

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'admin-menu-toggle';
    toggle.id = 'admin-menu-toggle';
    toggle.setAttribute('aria-label', 'Abrir menú');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<i class="fas fa-bars"></i>';
    header.insertBefore(toggle, header.firstChild);

    const overlay = document.createElement('div');
    overlay.className = 'admin-sidebar-overlay';
    overlay.id = 'admin-sidebar-overlay';
    document.body.appendChild(overlay);

    const icono = toggle.querySelector('i');

    // muestra el menú lateral y bloquea el desplazamiento de la página.
    function abrir() {
        sidebar.classList.add('sidebar-abierto');
        overlay.classList.add('visible');
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', 'Cerrar menú');
        if (icono) icono.className = 'fas fa-times';
        document.body.style.overflow = 'hidden';
    }

    // oculta el menú lateral y restablece el desplazamiento de la página.
    function cerrar() {
        sidebar.classList.remove('sidebar-abierto');
        overlay.classList.remove('visible');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Abrir menú');
        if (icono) icono.className = 'fas fa-bars';
        document.body.style.overflow = '';
    }

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (sidebar.classList.contains('sidebar-abierto')) {
            cerrar();
        } else {
            abrir();
        }
    });

    overlay.addEventListener('click', cerrar);

    sidebar.querySelectorAll('.admin-nav a').forEach((link) => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 900) {
                cerrar();
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('sidebar-abierto')) {
            cerrar();
        }
    });

    let ultimoAncho = window.innerWidth;
    window.addEventListener('resize', () => {
        const ancho = window.innerWidth;
        if (ultimoAncho <= 900 && ancho > 900) {
            cerrar();
        }
        ultimoAncho = ancho;
    });
}

// TABLAS RESPONSIVE
// a?ade etiquetas de datos a la configuraci?n del gr?fico.
function aplicarDataLabels(tabla) {
    const encabezados = Array.from(tabla.querySelectorAll('thead th')).map((th) =>
        th.textContent.replace(/\s+/g, ' ').trim()
    );

    tabla.querySelectorAll('tbody tr').forEach((fila) => {
        fila.querySelectorAll('td').forEach((celda, indice) => {
            if (!celda.hasAttribute('data-label')) {
                celda.setAttribute('data-label', encabezados[indice] || '');
            }
        });
    });
}

// adapta las tablas para su visualizaci?n en pantallas peque?as.
function prepararTablasResponsive() {
    document.querySelectorAll('table.admin-table').forEach((tabla) => {
        aplicarDataLabels(tabla);

        const tbody = tabla.querySelector('tbody');
        if (!tbody) return;

        const observador = new MutationObserver(() => {
            aplicarDataLabels(tabla);
        });

        observador.observe(tbody, { childList: true, subtree: false });
    });
}

// actualizar la marca en el panel admin.
const actualizarMarcaAdmin = async () => {
    try {
        const respuesta = await fetch(`${API_BASE}/configuracion`);
        if (!respuesta.ok) return;

        const config = await respuesta.json();
        const marca = config.marca_nombre || 'DuotechBros';

        // SIDEBAR
        const brandSidebar = document.querySelector('.admin-sidebar-brand h2');
        if (brandSidebar) brandSidebar.textContent = marca;

        // TEXTOS CON LA CLASE ADMIN-MARCA
        document.querySelectorAll('.admin-marca').forEach((el) => {
            el.textContent = marca;
        });
    } catch (error) {
        console.warn('No se pudo actualizar la marca en el admin:', error.message);
    }
};

// FILTRADO POR RANGO DE TIEMPO (usado en varias secciones)
// filtra los elementos seg?n el intervalo de tiempo seleccionado.
const filtrarPorRangoTiempo = (items, rango, campoFecha = 'creado_en') => {
    if (rango === 'todos') return items;

    const ahora = new Date();
    ahora.setHours(23, 59, 59, 999);

    let limite = new Date();
    limite.setHours(0, 0, 0, 0);

    if (rango === 'hoy') {
        limite.setHours(0, 0, 0, 0);
    } else if (rango === 'semana') {
        limite.setDate(limite.getDate() - 7);
    } else if (rango === 'mes') {
        const diaActual = limite.getDate();
        limite.setDate(1);
        limite.setMonth(limite.getMonth() - 1);
        const ultimoDiaMesAnterior = new Date(
            limite.getFullYear(),
            limite.getMonth() + 1,
            0
        ).getDate();
        limite.setDate(Math.min(diaActual, ultimoDiaMesAnterior));
    }

    return items.filter((item) => {
        const valorFecha = item[campoFecha];
        if (!valorFecha) return false;

        const fecha = new Date(String(valorFecha).replace(' ', 'T'));
        if (isNaN(fecha)) return false;

        if (fecha > ahora) return false;

        if (rango === 'hoy') {
            return fecha.toDateString() === new Date().toDateString();
        }

        return fecha >= limite;
    });
};

// PROTECCION AUTOMATICA DE PAGINAS INTERNAS

document.addEventListener('DOMContentLoaded', () => {
    if (document.body.dataset.adminProtected === 'true') {
        protegerPagina();
    }

    iniciarMenuMobile();
    prepararTablasResponsive();
    actualizarMarcaAdmin();
});