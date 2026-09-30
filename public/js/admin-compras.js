// LOGICA DE LA PAGINA "COMPRAS DE TIENDA" - DUOTECHBROS ADMIN
// lista solo los pedidos con tipo='producto'
// permite ver el detalle en formato factura (read-only) y cambiar el estado

const API_PEDIDOS = '/api/pedidos';
const API_ADMIN_PEDIDOS = '/api/admin/pedidos';
const API_DETALLE = '/api/pedidos';

const tbody = document.getElementById('tbody-compras');
const contador = document.getElementById('contador-compras');
const estadoVacio = document.getElementById('estado-vacio');
const estadoSinResultados = document.getElementById('estado-sin-resultados');
const estadoCargando = document.getElementById('estado-cargando');
const btnRefresh = document.getElementById('btn-refresh');

const buscador = document.getElementById('buscador-compras');
const filtrosEstado = document.getElementById('filtros-estado');
const btnLimpiar = document.getElementById('btn-limpiar');

// modal factura
const modalFactura = document.getElementById('modal-factura');
const modalClose = document.getElementById('modal-close');
const facturaContenido = document.getElementById('factura-contenido');
const facturaEstado = document.getElementById('factura-estado');
const btnGuardarEstado = document.getElementById('btn-guardar-estado');

const ESTADOS = ['pendiente', 'en proceso', 'completado', 'cancelado'];
const POR_PAGINA = 10;

// estado local
let comprasOriginales = [];
let comprasFiltradas = [];
let estadoFiltroActivo = 'Todos';
let textoBusqueda = '';
let ordenActual = { campo: null, tipo: null, direccion: 'asc' };
let paginador = null;
let pedidoFacturaActual = null;

// UTILIDADES

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

function formatearPrecio(precio) {
    const num = Number(precio);
    if (isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
}

function escapar(texto) {
    if (texto === null || texto === undefined) return '—';
    const div = document.createElement('div');
    div.textContent = String(texto);
    return div.innerHTML;
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

function mostrarToast(mensaje, esError = false) {
    const anterior = document.getElementById('toast-admin');
    if (anterior) anterior.remove();

    const toast = document.createElement('div');
    toast.id = 'toast-admin';
    toast.className = 'toast-admin' + (esError ? ' toast-error' : '');
    toast.innerHTML = `<span>${mensaje}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('toast-visible'), 10);
    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ORDENAMIENTO

function aplicarOrdenamiento(array) {
    if (!ordenActual.campo) return array;
    return [...array].sort((a, b) => {
        const cmp = compararValores(a[ordenActual.campo], b[ordenActual.campo], ordenActual.tipo);
        return ordenActual.direccion === 'asc' ? cmp : -cmp;
    });
}

// FILTROS

function construirFiltrosEstado() {
    const opciones = ['Todos', ...ESTADOS];
    filtrosEstado.innerHTML = '';

    opciones.forEach((estado) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'filtro-chip' + (estado === estadoFiltroActivo ? ' active' : '');
        chip.dataset.estado = estado;
        chip.textContent = estado === 'Todos' ? 'Todos' : capitalizar(estado);

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
    const hayFiltro = estadoFiltroActivo !== 'Todos' || textoBusqueda.trim() !== '';
    btnLimpiar.disabled = !hayFiltro;
}

// RENDERIZADO

function renderizarCompras(compras) {
    tbody.innerHTML = '';

    if (compras.length === 0) {
        if (comprasOriginales.length === 0) {
            estadoVacio.style.display = 'block';
        } else {
            estadoSinResultados.style.display = 'block';
        }
        contador.textContent = '0 compras';
        return;
    }

    contador.textContent = `${compras.length} compra${compras.length !== 1 ? 's' : ''}`;

    const itemsPagina = paginador ? paginador.getItems(compras) : compras;

    itemsPagina.forEach((c) => {
        const estadoActual = c.estado || 'pendiente';
        const pedidoId = String(c.id).padStart(4, '0');

        // extraer el total desde el campo que devuelve el backend
        const total = c.total_precio !== undefined ? Number(c.total_precio) : null;
        const totalTexto = total !== null ? formatearPrecio(total) : '—';

        // items y unidades vienen del backend como agregados
        const items = Number(c.total_items) || 0;
        const unidades = Number(c.total_unidades) || 0;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="cell-nombre">#${pedidoId}</span></td>
            <td>${escapar(c.usuario_nombre || c.nombre_cliente || '—')}</td>
            <td>${items}</td>
            <td>${unidades}</td>
            <td><span class="cell-precio">${totalTexto}</span></td>
            <td><span class="cell-fecha">${formatearFecha(c.creado_en)}</span></td>
            <td>
                <span class="badge ${claseBadgeEstado(estadoActual)}">
                    ${capitalizar(estadoActual)}
                </span>
            </td>
            <td style="text-align: right">
                <button class="btn-ver-factura" title="Ver factura" data-id="${c.id}">
                    <i class="fas fa-file-invoice"></i> Ver factura
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-ver-factura').forEach((btn) => {
        btn.addEventListener('click', () => {
            abrirModalFactura(btn.dataset.id);
        });
    });
}

// APLICAR FILTROS

function aplicarFiltros() {
    estadoVacio.style.display = 'none';
    estadoSinResultados.style.display = 'none';

    let filtrados = [...comprasOriginales];

    if (estadoFiltroActivo !== 'Todos') {
        filtrados = filtrados.filter(
            (c) => (c.estado || 'pendiente').toLowerCase() === estadoFiltroActivo.toLowerCase()
        );
    }

    if (textoBusqueda.trim() !== '') {
        const q = textoBusqueda.trim().toLowerCase();
        filtrados = filtrados.filter(
            (c) =>
                (c.usuario_nombre && c.usuario_nombre.toLowerCase().includes(q)) ||
                (c.nombre_cliente && c.nombre_cliente.toLowerCase().includes(q)) ||
                String(c.id).includes(q)
        );
    }

    filtrados = aplicarOrdenamiento(filtrados);
    comprasFiltradas = filtrados;

    if (paginador) paginador.actualizar(comprasFiltradas.length, true);

    actualizarBotonLimpiar();
    renderizarCompras(comprasFiltradas);
}

// CARGA DE DATOS

async function cargarCompras() {
    estadoCargando.style.display = 'block';
    estadoVacio.style.display = 'none';
    estadoSinResultados.style.display = 'none';
    tbody.innerHTML = '';

    const icono = btnRefresh.querySelector('i');
    icono.classList.add('spinning');
    btnRefresh.disabled = true;

    try {
        // traer TODOS los pedidos y quedarnos con los de tipo producto
        // el backend ahora soporta ?tipo=producto, pero traemos todos y filtramos aca
        // para no perder compatibilidad si hay datos viejos sin tipo asignado
        const respuesta = await fetch(`${API_PEDIDOS}?tipo=producto`);
        if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
        const compras = await respuesta.json();

        // cargar el detalle (items y totales) de cada compra en paralelo
        const comprasConDetalle = await Promise.all(
            compras.map(async (c) => {
                try {
                    const resDetalle = await fetchAdmin(`${API_DETALLE}/${c.id}/detalle`);
                    if (!resDetalle.ok) return { ...c, total_items: 0, total_unidades: 0, total_precio: 0 };
                    const data = await resDetalle.json();
                    if (!data.success || !data.pedido) {
                        return { ...c, total_items: 0, total_unidades: 0, total_precio: 0 };
                    }
                    return {
                        ...c,
                        usuario_nombre: data.pedido.usuario_nombre,
                        total_items: data.pedido.total_items,
                        total_unidades: data.pedido.total_unidades,
                        total_precio: data.pedido.total_precio,
                    };
                } catch {
                    return { ...c, total_items: 0, total_unidades: 0, total_precio: 0 };
                }
            })
        );

        comprasOriginales = comprasConDetalle;

        if (comprasConDetalle.length === 0) {
            comprasFiltradas = [];
            estadoVacio.style.display = 'block';
            contador.textContent = '0 compras';
            if (paginador) paginador.actualizar(0, true);
        } else {
            aplicarFiltros();
        }
    } catch (error) {
        console.error('Error al cargar compras:', error);
        tbody.innerHTML = '';
        comprasFiltradas = [];
        estadoVacio.style.display = 'block';
        estadoVacio.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="color:#d9534f"></i>
            <p>No se pudieron cargar las compras</p>
            <small>Verifica que el servidor este corriendo e intenta de nuevo.</small>
        `;
    } finally {
        estadoCargando.style.display = 'none';
        icono.classList.remove('spinning');
        btnRefresh.disabled = false;
    }
}

// MODAL: FACTURA DE COMPRA (READ-ONLY)

async function abrirModalFactura(id) {
    pedidoFacturaActual = null;
    facturaContenido.innerHTML = '<div class="factura-cargando"><i class="fas fa-spinner fa-spin"></i> Cargando factura...</div>';
    modalFactura.classList.add('modal-visible');

    try {
        const respuesta = await fetchAdmin(`${API_DETALLE}/${id}/detalle`);
        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

        const data = await respuesta.json();
        if (!data.success || !data.pedido) {
            facturaContenido.innerHTML = '<div class="factura-cargando">No se pudo cargar la factura.</div>';
            return;
        }

        pedidoFacturaActual = data.pedido;

        // precargar el estado actual en el select
        facturaEstado.value = pedidoFacturaActual.estado || 'pendiente';

        renderizarFactura(pedidoFacturaActual);
    } catch (error) {
        console.error('Error al cargar factura:', error);
        facturaContenido.innerHTML = '<div class="factura-cargando">No se pudo conectar con el servidor.</div>';
    }
}

function renderizarFactura(pedido) {
    const numero = String(pedido.id).padStart(4, '0');
    const estadoActual = pedido.estado || 'pendiente';

    const itemsHTML = pedido.items
        .map(
            (item) => `
            <tr>
                <td>${escapar(item.nombre_producto)}</td>
                <td style="text-align: center">${item.cantidad}</td>
                <td style="text-align: right">${formatearPrecio(item.precio_unitario)}</td>
                <td style="text-align: right">${formatearPrecio(item.subtotal)}</td>
            </tr>
        `
        )
        .join('');

    facturaContenido.innerHTML = `
        <div class="factura-encabezado">
            <div class="factura-marca">
                <div class="factura-logo">D</div>
                <div>
                    <h1>DuotechBros</h1>
                    <p>Servicio tecnico y accesorios</p>
                </div>
            </div>
            <div class="factura-numero">
                <span class="factura-numero-label">Factura</span>
                <span class="factura-numero-valor">#${numero}</span>
                <span class="badge ${claseBadgeEstado(estadoActual)}">
                    ${capitalizar(estadoActual)}
                </span>
            </div>
        </div>

        <div class="factura-datos">
            <div class="factura-datos-bloque">
                <span class="factura-datos-label">Cliente</span>
                <strong>${escapar(pedido.usuario_nombre || pedido.nombre_cliente || '—')}</strong>
            </div>
            <div class="factura-datos-bloque">
                <span class="factura-datos-label">Fecha de emision</span>
                <strong>${formatearFecha(pedido.creado_en)}</strong>
            </div>
            <div class="factura-datos-bloque">
                <span class="factura-datos-label">Items</span>
                <strong>${pedido.total_items}</strong>
            </div>
            <div class="factura-datos-bloque">
                <span class="factura-datos-label">Unidades</span>
                <strong>${pedido.total_unidades}</strong>
            </div>
        </div>

        <div class="factura-tabla-wrapper">
            <table class="factura-tabla">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th style="text-align: center">Cantidad</th>
                        <th style="text-align: right">Precio unit.</th>
                        <th style="text-align: right">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
            </table>
        </div>

        <div class="factura-totales">
            <div class="factura-total-linea">
                <span>Total de unidades</span>
                <strong>${pedido.total_unidades}</strong>
            </div>
            <div class="factura-total-linea factura-total-final">
                <span>Total</span>
                <strong>${formatearPrecio(pedido.total_precio)}</strong>
            </div>
        </div>

        <div class="factura-nota">
            <i class="fas fa-lock"></i>
            <p>
                Esta factura es un registro inmutable de la compra. Los datos del
                pedido no pueden modificarse. Solo se permite actualizar el estado.
            </p>
        </div>
    `;
}

function cerrarModalFactura() {
    modalFactura.classList.remove('modal-visible');
    pedidoFacturaActual = null;
}

// CAMBIO DE ESTADO DE LA FACTURA

async function guardarEstadoFactura() {
    if (!pedidoFacturaActual) return;

    const nuevoEstado = facturaEstado.value;
    const estadoActual = pedidoFacturaActual.estado || 'pendiente';

    if (nuevoEstado === estadoActual) {
        mostrarToast('El estado no cambio.', true);
        return;
    }

    btnGuardarEstado.disabled = true;
    btnGuardarEstado.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    try {
        const respuesta = await fetchAdmin(`${API_ADMIN_PEDIDOS}/${pedidoFacturaActual.id}`, {
            method: 'PUT',
            body: JSON.stringify({ estado: nuevoEstado }),
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            mostrarToast(`Estado actualizado a "${capitalizar(nuevoEstado)}"`);
            pedidoFacturaActual.estado = nuevoEstado;

            // actualizar el estado en la lista local
            const compra = comprasOriginales.find((c) => String(c.id) === String(pedidoFacturaActual.id));
            if (compra) compra.estado = nuevoEstado;

            // refrescar el badge en la factura y en la tabla
            renderizarFactura(pedidoFacturaActual);
            renderizarCompras(comprasFiltradas);
        } else {
            mostrarToast(`Error: ${resultado.error || 'No se pudo actualizar'}`, true);
        }
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        mostrarToast('No se pudo conectar con el servidor', true);
    } finally {
        btnGuardarEstado.disabled = false;
        btnGuardarEstado.innerHTML = '<i class="fas fa-save"></i> Guardar estado';
    }
}

// EVENTOS

btnRefresh.addEventListener('click', cargarCompras);
modalClose.addEventListener('click', cerrarModalFactura);

modalFactura.addEventListener('click', (e) => {
    if (e.target === modalFactura) cerrarModalFactura();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalFactura.classList.contains('modal-visible')) {
        cerrarModalFactura();
    }
});

btnGuardarEstado.addEventListener('click', guardarEstadoFactura);

buscador.addEventListener('input', (e) => {
    textoBusqueda = e.target.value;
    aplicarFiltros();
});

btnLimpiar.addEventListener('click', () => {
    textoBusqueda = '';
    buscador.value = '';
    estadoFiltroActivo = 'Todos';
    filtrosEstado.querySelectorAll('.filtro-chip').forEach((c) => {
        c.classList.toggle('active', c.dataset.estado === 'Todos');
    });
    aplicarFiltros();
});

// INICIO

document.addEventListener('DOMContentLoaded', () => {
    paginador = crearPaginador('paginacion-compras', POR_PAGINA, () => {
        renderizarCompras(comprasFiltradas);
    });

    construirFiltrosEstado();

    configurarColumnasOrdenables(
        'tabla-compras',
        {
            0: { campo: 'id', tipo: 'numero' },
            1: { campo: 'usuario_nombre', tipo: 'string' },
            2: { campo: 'total_items', tipo: 'numero' },
            3: { campo: 'total_unidades', tipo: 'numero' },
            4: { campo: 'total_precio', tipo: 'numero' },
            5: { campo: 'creado_en', tipo: 'fecha' },
            6: { campo: 'estado', tipo: 'string' },
        },
        () => ordenActual,
        (nuevo) => { ordenActual = nuevo; },
        aplicarFiltros
    );

    setTimeout(cargarCompras, 100);
});