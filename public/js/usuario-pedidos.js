// LOGICA DE LA PAGINA DE MIS PEDIDOS DEL USUARIO
// muestra reparaciones y compras, con filtros y buscador

const API_PEDIDOS_USUARIO = '/api/usuarios/pedidos';

const usuarioSpan = document.getElementById('pedidos-usuario');

const pedidosToolbar = document.getElementById('pedidos-toolbar');
const buscador = document.getElementById('buscador-pedidos');
const filtrosTipo = document.getElementById('filtros-tipo');
const filtrosEstado = document.getElementById('filtros-estado');
const btnLimpiar = document.getElementById('btn-limpiar');

const pedidosContador = document.getElementById('pedidos-contador');
const contadorTexto = document.getElementById('contador-texto');

const estadoCargando = document.getElementById('estado-cargando');
const estadoVacio = document.getElementById('estado-vacio');
const estadoSinResultados = document.getElementById('estado-sin-resultados');
const estadoError = document.getElementById('estado-error');
const pedidosLista = document.getElementById('pedidos-lista');

// modal
const modalDetalle = document.getElementById('modal-detalle');
const modalClose = document.getElementById('modal-close');
const modalPedidoId = document.getElementById('modal-pedido-id');
const modalInfo = document.getElementById('modal-info');
const modalItems = document.getElementById('modal-items');
const modalTotal = document.getElementById('modal-total');

// tipos y estados disponibles
const TIPOS = ['Todos', 'Reparacion', 'Compra'];
const ESTADOS = ['Todos', 'pendiente', 'en proceso', 'completado', 'cancelado'];

// estado local
let pedidosActuales = [];
let tipoFiltroActivo = 'Todos';
let estadoFiltroActivo = 'Todos';
let textoBusqueda = '';

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

// UTILIDADES GENERALES

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

function formatearFecha(fechaISO) {
    if (!fechaISO) return '—';
    const fecha = new Date(fechaISO.replace(' ', 'T'));
    if (isNaN(fecha)) return fechaISO;

    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${anio} ${horas}:${minutos}`;
}

function normalizarEstado(estado) {
    return (estado || 'pendiente').toLowerCase().trim().replace(/\s+/g, '-');
}

function claseBadgeEstado(estado) {
    const e = normalizarEstado(estado);
    const validos = ['pendiente', 'en-proceso', 'completado', 'cancelado'];
    return validos.includes(e) ? `badge-${e}` : 'badge-pendiente';
}

function capitalizar(texto) {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// TIPO DE PEDIDO

function esReparacion(pedido) {
    return (pedido.tipo || 'reparacion') === 'reparacion';
}

// FILTROS

function construirFiltrosTipo() {
    filtrosTipo.innerHTML = '';

    TIPOS.forEach((tipo) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'filtro-chip' + (tipo === tipoFiltroActivo ? ' active' : '');
        chip.dataset.tipo = tipo;

        // texto e icono segun el tipo
        let icono = '';
        if (tipo === 'Reparacion') icono = '<i class="fas fa-tools"></i> ';
        else if (tipo === 'Compra') icono = '<i class="fas fa-shopping-bag"></i> ';
        chip.innerHTML = icono + tipo;

        chip.addEventListener('click', () => {
            tipoFiltroActivo = tipo;
            filtrosTipo.querySelectorAll('.filtro-chip').forEach((c) => {
                c.classList.toggle('active', c.dataset.tipo === tipo);
            });
            aplicarFiltros();
        });

        filtrosTipo.appendChild(chip);
    });
}

function construirFiltrosEstado() {
    filtrosEstado.innerHTML = '';

    ESTADOS.forEach((estado) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'filtro-chip' + (estado === estadoFiltroActivo ? ' active' : '');
        chip.dataset.estado = estado;
        chip.textContent = estado === 'Todos' ? 'Todos los estados' : capitalizar(estado);

        chip.addEventListener('click', () => {
            estadoFiltroActivo = estado;
            filtrosEstado.querySelectorAll('.filtro-chip').forEach((c) => {
                c.classList.toggle('active', c.dataset.estado === estado);
            });
            aplicarFiltros();
        });

        filtrosEstado.appendChild(chip);
    });
}

function actualizarBotonLimpiar() {
    const hayFiltro =
        tipoFiltroActivo !== 'Todos' ||
        estadoFiltroActivo !== 'Todos' ||
        textoBusqueda.trim() !== '';
    btnLimpiar.disabled = !hayFiltro;
}

// APLICAR FILTROS

function aplicarFiltros() {
    // ocultar todos los estados
    estadoVacio.style.display = 'none';
    estadoSinResultados.style.display = 'none';
    estadoError.style.display = 'none';

    let filtrados = [...pedidosActuales];

    // filtro por tipo
    if (tipoFiltroActivo === 'Reparacion') {
        filtrados = filtrados.filter((p) => esReparacion(p));
    } else if (tipoFiltroActivo === 'Compra') {
        filtrados = filtrados.filter((p) => !esReparacion(p));
    }

    // filtro por estado
    if (estadoFiltroActivo !== 'Todos') {
        filtrados = filtrados.filter(
            (p) => (p.estado || 'pendiente').toLowerCase() === estadoFiltroActivo.toLowerCase()
        );
    }

    // busqueda por texto
    if (textoBusqueda.trim() !== '') {
        const q = textoBusqueda.trim().toLowerCase();
        filtrados = filtrados.filter((p) => {
            const numero = String(p.id).padStart(4, '0');
            const modelo = (p.modelo_celular || '').toLowerCase();
            const descripcion = (p.descripcion_problema || '').toLowerCase();

            return (
                numero.includes(q) ||
                modelo.includes(q) ||
                descripcion.includes(q)
            );
        });
    }

    // si no hay pedidos originales, mostrar vacio
    if (pedidosActuales.length === 0) {
        estadoVacio.style.display = 'block';
        pedidosLista.style.display = 'none';
        pedidosContador.style.display = 'none';
        actualizarBotonLimpiar();
        return;
    }

    // hay pedidos originales pero los filtros no devolvieron nada
    if (filtrados.length === 0) {
        estadoSinResultados.style.display = 'block';
        pedidosLista.style.display = 'none';
        pedidosContador.style.display = 'none';
        actualizarBotonLimpiar();
        return;
    }

    // mostrar lista
    pedidosLista.style.display = 'flex';
    pedidosContador.style.display = 'block';
    actualizarContador(filtrados.length);

    renderizarPedidos(filtrados);
    actualizarBotonLimpiar();
}

function actualizarContador(cantidad) {
    contadorTexto.textContent = `${cantidad} pedido${cantidad !== 1 ? 's' : ''}`;
}

// RENDERIZADO

function renderizarPedidos(pedidos) {
    pedidosLista.innerHTML = '';

    pedidos.forEach((pedido) => {
        const card = document.createElement('article');
        card.className = 'pedido-card';
        card.dataset.tipo = esReparacion(pedido) ? 'reparacion' : 'compra';

        card.innerHTML = esReparacion(pedido)
            ? generarCardReparacion(pedido)
            : generarCardCompra(pedido);

        pedidosLista.appendChild(card);
    });

    // asignar eventos a los botones
    pedidosLista.querySelectorAll('.pedido-btn-detalle').forEach((btn) => {
        btn.addEventListener('click', () => {
            abrirModalDetalle(btn.dataset.id);
        });
    });
}

function generarCardReparacion(pedido) {
    const estadoActual = pedido.estado || 'pendiente';
    const pedidoIdFormateado = `#${String(pedido.id).padStart(4, '0')}`;
    const modelo = pedido.modelo_celular || '—';
    const descripcion = pedido.descripcion_problema || 'Sin descripcion';

    return `
        <div class="pedido-card-header pedido-card-header-reparacion">
            <div class="pedido-card-id">
                <i class="fas fa-tools"></i>
                <strong>Pedido de Reparacion ${pedidoIdFormateado}</strong>
                <span class="pedido-tipo-badge pedido-tipo-reparacion">
                    <i class="fas fa-tools"></i> Reparacion
                </span>
            </div>
            <span class="badge ${claseBadgeEstado(estadoActual)}">
                ${capitalizar(estadoActual)}
            </span>
        </div>

        <div class="pedido-card-body">
            <div class="pedido-card-info">
                <div class="pedido-card-info-item">
                    <i class="fas fa-calendar-alt"></i>
                    <span>${formatearFecha(pedido.creado_en)}</span>
                </div>
                <div class="pedido-card-info-item">
                    <i class="fas fa-mobile-alt"></i>
                    <span>${escapar(modelo)}</span>
                </div>
            </div>

            <p class="pedido-card-descripcion">
                ${escapar(descripcion)}
            </p>
        </div>

        <div class="pedido-card-footer">
            <button type="button" class="pedido-btn-detalle" data-id="${pedido.id}">
                <i class="fas fa-eye"></i> Ver detalle
            </button>
        </div>
    `;
}

function generarCardCompra(pedido) {
    const estadoActual = pedido.estado || 'pendiente';
    const pedidoIdFormateado = `#${String(pedido.id).padStart(4, '0')}`;
    const totalItems = Number(pedido.total_items) || 0;
    const totalUnidades = Number(pedido.total_unidades) || 0;

    return `
        <div class="pedido-card-header pedido-card-header-compra">
            <div class="pedido-card-id">
                <i class="fas fa-shopping-bag"></i>
                <strong>Compra ${pedidoIdFormateado}</strong>
                <span class="pedido-tipo-badge pedido-tipo-compra">
                    <i class="fas fa-shopping-bag"></i> Compra
                </span>
            </div>
            <span class="badge ${claseBadgeEstado(estadoActual)}">
                ${capitalizar(estadoActual)}
            </span>
        </div>

        <div class="pedido-card-body">
            <div class="pedido-card-info">
                <div class="pedido-card-info-item">
                    <i class="fas fa-calendar-alt"></i>
                    <span>${formatearFecha(pedido.creado_en)}</span>
                </div>
                <div class="pedido-card-info-item">
                    <i class="fas fa-box"></i>
                    <span>${totalItems} producto${totalItems !== 1 ? 's' : ''}</span>
                </div>
                <div class="pedido-card-info-item">
                    <i class="fas fa-cubes"></i>
                    <span>${totalUnidades} unidad${totalUnidades !== 1 ? 'es' : ''}</span>
                </div>
            </div>

            <div class="pedido-card-total">
                <span class="pedido-card-total-label">Total</span>
                <span class="pedido-card-total-valor">${formatearPrecio(pedido.total_precio)}</span>
            </div>
        </div>

        <div class="pedido-card-footer">
            <button type="button" class="pedido-btn-detalle" data-id="${pedido.id}">
                <i class="fas fa-eye"></i> Ver detalle
            </button>
        </div>
    `;
}

// CARGAR PEDIDOS

async function cargarPedidos() {
    estadoCargando.style.display = 'block';
    estadoVacio.style.display = 'none';
    estadoSinResultados.style.display = 'none';
    estadoError.style.display = 'none';
    pedidosLista.style.display = 'none';
    pedidosToolbar.style.display = 'none';
    pedidosContador.style.display = 'none';

    try {
        const respuesta = await fetch(API_PEDIDOS_USUARIO, {
            headers: {
                Authorization: `Bearer ${obtenerTokenUsuario()}`,
            },
        });

        if (respuesta.status === 401) {
            cerrarSesionUsuario();
            window.location.href = '/user/login.html';
            return;
        }

        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

        const data = await respuesta.json();
        pedidosActuales = data.pedidos || [];

        // construir los filtros la primera vez
        construirFiltrosTipo();
        construirFiltrosEstado();

        // aplicar filtros y renderizar
        aplicarFiltros();

        // mostrar la toolbar solo si hay pedidos
        if (pedidosActuales.length > 0) {
            pedidosToolbar.style.display = 'flex';
        }
    } catch (error) {
        console.error('Error al cargar pedidos:', error);
        estadoError.style.display = 'block';
    } finally {
        estadoCargando.style.display = 'none';
    }
}

// MODAL DE DETALLE

async function abrirModalDetalle(pedidoId) {
    modalPedidoId.textContent = `#${String(pedidoId).padStart(4, '0')}`;
    modalInfo.innerHTML = '<p class="pedido-modal-cargando"><i class="fas fa-spinner fa-spin"></i> Cargando...</p>';
    modalItems.innerHTML = '';
    modalTotal.innerHTML = '';
    modalDetalle.classList.add('modal-visible');

    try {
        const respuesta = await fetch(`${API_PEDIDOS_USUARIO}/${pedidoId}`, {
            headers: {
                Authorization: `Bearer ${obtenerTokenUsuario()}`,
            },
        });

        if (respuesta.status === 401) {
            cerrarSesionUsuario();
            window.location.href = '/user/login.html';
            return;
        }

        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

        const data = await respuesta.json();

        if (!data.success || !data.pedido) {
            modalInfo.innerHTML = '<p class="pedido-modal-error">No se pudo cargar el detalle.</p>';
            return;
        }

        if (esReparacion(data.pedido)) {
            renderizarDetalleReparacion(data.pedido);
        } else {
            renderizarDetalleCompra(data.pedido);
        }
    } catch (error) {
        console.error('Error al cargar detalle:', error);
        modalInfo.innerHTML = '<p class="pedido-modal-error">No se pudo conectar con el servidor.</p>';
    }
}

function renderizarDetalleReparacion(pedido) {
    const estadoActual = pedido.estado || 'pendiente';

    modalInfo.innerHTML = `
        <div class="pedido-modal-info-linea">
            <span class="pedido-modal-info-label">Tipo</span>
            <span class="pedido-tipo-badge pedido-tipo-reparacion">
                <i class="fas fa-tools"></i> Reparacion
            </span>
        </div>
        <div class="pedido-modal-info-linea">
            <span class="pedido-modal-info-label">Fecha</span>
            <span class="pedido-modal-info-valor">${formatearFecha(pedido.creado_en)}</span>
        </div>
        <div class="pedido-modal-info-linea">
            <span class="pedido-modal-info-label">Estado</span>
            <span class="badge ${claseBadgeEstado(estadoActual)}">
                ${capitalizar(estadoActual)}
            </span>
        </div>
        <div class="pedido-modal-info-linea">
            <span class="pedido-modal-info-label">Cliente</span>
            <span class="pedido-modal-info-valor">${escapar(pedido.nombre_cliente)}</span>
        </div>
        <div class="pedido-modal-info-linea">
            <span class="pedido-modal-info-label">Contacto</span>
            <span class="pedido-modal-info-valor">${escapar(pedido.telefono || pedido.email)}</span>
        </div>
    `;

    modalItems.innerHTML = `
        <h3 class="pedido-modal-items-titulo">
            <i class="fas fa-mobile-alt"></i> Detalle del equipo
        </h3>
        <div class="pedido-reparacion-bloque">
            <div class="pedido-reparacion-linea">
                <span class="pedido-reparacion-label">Modelo</span>
                <span class="pedido-reparacion-valor">${escapar(pedido.modelo_celular || '—')}</span>
            </div>
            <div class="pedido-reparacion-linea pedido-reparacion-linea-descripcion">
                <span class="pedido-reparacion-label">Descripcion del problema</span>
                <p class="pedido-reparacion-texto">${escapar(pedido.descripcion_problema || 'Sin descripcion')}</p>
            </div>
        </div>
    `;

    modalTotal.innerHTML = `
        <div class="pedido-modal-total-linea">
            <span>Presupuesto</span>
            <strong class="pedido-modal-sin-precio">A confirmar</strong>
        </div>
        <p class="pedido-modal-aclaracion">
            <i class="fas fa-info-circle"></i>
            El presupuesto se confirma una vez que revisamos el equipo.
        </p>
    `;
}

function renderizarDetalleCompra(pedido) {
    const estadoActual = pedido.estado || 'pendiente';

    modalInfo.innerHTML = `
        <div class="pedido-modal-info-linea">
            <span class="pedido-modal-info-label">Tipo</span>
            <span class="pedido-tipo-badge pedido-tipo-compra">
                <i class="fas fa-shopping-bag"></i> Compra
            </span>
        </div>
        <div class="pedido-modal-info-linea">
            <span class="pedido-modal-info-label">Fecha</span>
            <span class="pedido-modal-info-valor">${formatearFecha(pedido.creado_en)}</span>
        </div>
        <div class="pedido-modal-info-linea">
            <span class="pedido-modal-info-label">Estado</span>
            <span class="badge ${claseBadgeEstado(estadoActual)}">
                ${capitalizar(estadoActual)}
            </span>
        </div>
        <div class="pedido-modal-info-linea">
            <span class="pedido-modal-info-label">Unidades</span>
            <span class="pedido-modal-info-valor">${pedido.total_unidades}</span>
        </div>
    `;

    if (!pedido.items || pedido.items.length === 0) {
        modalItems.innerHTML = '<p class="pedido-modal-vacio">Este pedido no tiene items registrados.</p>';
    } else {
        modalItems.innerHTML = `
            <h3 class="pedido-modal-items-titulo">
                <i class="fas fa-shopping-bag"></i> Productos
            </h3>
            ${pedido.items
                .map(
                    (item) => `
                <div class="pedido-modal-item">
                    <div class="pedido-modal-item-info">
                        <div class="pedido-modal-item-nombre">${escapar(item.nombre_producto)}</div>
                        <div class="pedido-modal-item-detalle">
                            ${item.cantidad} x ${formatearPrecio(item.precio_unitario)}
                        </div>
                    </div>
                    <div class="pedido-modal-item-subtotal">${formatearPrecio(item.subtotal)}</div>
                </div>
            `
                )
                .join('')}
        `;
    }

    modalTotal.innerHTML = `
        <div class="pedido-modal-total-linea">
            <span>Productos</span>
            <strong>${pedido.total_items}</strong>
        </div>
        <div class="pedido-modal-total-linea">
            <span>Unidades</span>
            <strong>${pedido.total_unidades}</strong>
        </div>
        <div class="pedido-modal-total-linea pedido-modal-total-final">
            <span>Total</span>
            <strong>${formatearPrecio(pedido.total_precio)}</strong>
        </div>
    `;
}

function cerrarModalDetalle() {
    modalDetalle.classList.remove('modal-visible');
}

modalClose.addEventListener('click', cerrarModalDetalle);

modalDetalle.addEventListener('click', (e) => {
    if (e.target === modalDetalle) cerrarModalDetalle();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalDetalle.classList.contains('modal-visible')) {
        cerrarModalDetalle();
    }
});

// EVENTOS

buscador.addEventListener('input', (e) => {
    textoBusqueda = e.target.value;
    aplicarFiltros();
});

btnLimpiar.addEventListener('click', () => {
    textoBusqueda = '';
    buscador.value = '';
    tipoFiltroActivo = 'Todos';
    estadoFiltroActivo = 'Todos';

    filtrosTipo.querySelectorAll('.filtro-chip').forEach((c) => {
        c.classList.toggle('active', c.dataset.tipo === 'Todos');
    });
    filtrosEstado.querySelectorAll('.filtro-chip').forEach((c) => {
        c.classList.toggle('active', c.dataset.estado === 'Todos');
    });

    aplicarFiltros();
});

// INICIO

document.addEventListener('DOMContentLoaded', () => {
    if (!estaLogueadoUsuario()) {
        window.location.href = '/user/login.html';
        return;
    }

    if (usuarioSpan) {
        usuarioSpan.innerHTML = `<i class="fas fa-user-circle"></i> ${obtenerUsuarioActual()}`;
    }

    cargarPedidos();
});