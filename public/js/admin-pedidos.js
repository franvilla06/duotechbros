// ============================================================
// LÓGICA DE LA PÁGINA "VER PEDIDOS" - DuotechBros Admin
// Incluye: ver, cambiar estado, buscar, filtrar y exportar CSV
// ============================================================

const API_PEDIDOS = '/api/pedidos';
const API_ADMIN_PEDIDOS = '/api/admin/pedidos';

const tbody = document.getElementById('tbody-pedidos');
const contador = document.getElementById('contador-pedidos');
const estadoVacio = document.getElementById('estado-vacio');
const estadoSinResultados = document.getElementById('estado-sin-resultados');
const estadoCargando = document.getElementById('estado-cargando');
const btnRefresh = document.getElementById('btn-refresh');
const btnExportar = document.getElementById('btn-exportar');

// Búsqueda y filtros
const buscador = document.getElementById('buscador-pedidos');
const filtrosEstado = document.getElementById('filtros-estado');
const btnLimpiar = document.getElementById('btn-limpiar');

// Estados
const ESTADOS = ['pendiente', 'en proceso', 'completado', 'cancelado'];

// Estado local
let pedidosOriginales = [];
let pedidosFiltrados = []; // ← guardamos lo que se muestra actualmente (para exportar)
let estadoFiltroActivo = 'Todos';
let textoBusqueda = '';

// ----- UTILIDADES -----

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

// ============================================================
// EXPORTAR A CSV
// ============================================================

/**
 * Escapa un campo para CSV: si contiene comas, comillas o saltos de línea,
 * se encierra entre comillas dobles y las comillas internas se duplican.
 */
function escaparCSV(valor) {
    if (valor === null || valor === undefined) return '';
    const texto = String(valor);
    // Si tiene coma, comilla o salto de línea, envolver en comillas
    if (texto.includes(',') || texto.includes('"') || texto.includes('\n') || texto.includes('\r')) {
        return `"${texto.replace(/"/g, '""')}"`;
    }
    return texto;
}

/**
 * Exporta los pedidos actualmente filtrados a un archivo CSV.
 */
function exportarCSV() {
    if (pedidosFiltrados.length === 0) {
        mostrarToast('No hay pedidos para exportar.', true);
        return;
    }

    // Encabezados del CSV
    const encabezados = [
        'ID',
        'Nombre del cliente',
        'Teléfono',
        'Email',
        'Modelo del celular',
        'Descripción del problema',
        'Estado',
        'Fecha de creación',
    ];

    // Construir las filas
    const filas = pedidosFiltrados.map((p) => [
        p.id,
        p.nombre_cliente,
        p.telefono,
        p.email,
        p.modelo_celular,
        p.descripcion_problema,
        capitalizar(p.estado || 'pendiente'),
        formatearFecha(p.creado_en),
    ]);

    // Construir el contenido del CSV
    const lineas = [
        encabezados.map(escaparCSV).join(','),
        ...filas.map((fila) => fila.map(escaparCSV).join(',')),
    ];

    const contenido = lineas.join('\r\n');

    // BOM UTF-8 para que Excel reconozca los acentos
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + contenido], { type: 'text/csv;charset=utf-8;' });

    // Nombre del archivo con la fecha actual
    const hoy = new Date();
    const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    const nombreArchivo = `pedidos-duotechbros-${fecha}.csv`;

    // Descargar
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    mostrarToast(`✅ Se exportaron ${pedidosFiltrados.length} pedido${pedidosFiltrados.length !== 1 ? 's' : ''} a CSV.`);
}

// ----- FILTROS -----

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

// ----- RENDERIZADO -----

function renderizarPedidos(pedidos) {
    tbody.innerHTML = '';

    if (pedidos.length === 0) {
        if (pedidosOriginales.length === 0) {
            estadoVacio.style.display = 'block';
        } else {
            estadoSinResultados.style.display = 'block';
        }
        contador.textContent = '0 pedidos';
        return;
    }

    contador.textContent = `${pedidos.length} pedido${pedidos.length !== 1 ? 's' : ''}`;

    pedidos.forEach((p) => {
        const estadoActual = p.estado || 'pendiente';

        const opciones = ESTADOS.map(
            (e) =>
                `<option value="${e}" ${e === estadoActual ? 'selected' : ''}>${capitalizar(e)}</option>`
        ).join('');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="cell-nombre">${escapar(p.nombre_cliente)}</span></td>
            <td>
                <div class="cell-email">${escapar(p.email)}</div>
                <div class="cell-telefono">${escapar(p.telefono)}</div>
            </td>
            <td>${escapar(p.modelo_celular)}</td>
            <td>
                <div class="cell-descripcion" title="${escapar(p.descripcion_problema)}">
                    ${escapar(p.descripcion_problema)}
                </div>
            </td>
            <td><span class="cell-fecha">${formatearFecha(p.creado_en)}</span></td>
            <td>
                <span class="badge ${claseBadgeEstado(estadoActual)}" id="badge-${p.id}">
                    ${capitalizar(estadoActual)}
                </span>
            </td>
            <td style="text-align: right">
                <select class="estado-select" data-id="${p.id}" data-estado-anterior="${estadoActual}">
                    ${opciones}
                </select>
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.estado-select').forEach((select) => {
        select.addEventListener('change', () => {
            const id = select.dataset.id;
            const nuevoEstado = select.value;
            const estadoAnterior = select.dataset.estadoAnterior;
            if (nuevoEstado === estadoAnterior) return;
            cambiarEstado(id, nuevoEstado, estadoAnterior, select);
        });
    });
}

// ----- APLICAR FILTROS -----

function aplicarFiltros() {
    estadoVacio.style.display = 'none';
    estadoSinResultados.style.display = 'none';

    let filtrados = [...pedidosOriginales];

    if (estadoFiltroActivo !== 'Todos') {
        filtrados = filtrados.filter(
            (p) => (p.estado || 'pendiente').toLowerCase() === estadoFiltroActivo.toLowerCase()
        );
    }

    if (textoBusqueda.trim() !== '') {
        const q = textoBusqueda.trim().toLowerCase();
        filtrados = filtrados.filter(
            (p) =>
                (p.nombre_cliente && p.nombre_cliente.toLowerCase().includes(q)) ||
                (p.email && p.email.toLowerCase().includes(q)) ||
                (p.modelo_celular && p.modelo_celular.toLowerCase().includes(q)) ||
                (p.telefono && String(p.telefono).toLowerCase().includes(q))
        );
    }

    // Guardar para exportar CSV
    pedidosFiltrados = filtrados;

    actualizarBotonLimpiar();
    renderizarPedidos(filtrados);
}

// ----- CARGA DE DATOS -----

async function cargarPedidos() {
    estadoCargando.style.display = 'block';
    estadoVacio.style.display = 'none';
    estadoSinResultados.style.display = 'none';
    tbody.innerHTML = '';

    const icono = btnRefresh.querySelector('i');
    icono.classList.add('spinning');
    btnRefresh.disabled = true;

    try {
        const respuesta = await fetch(API_PEDIDOS);
        if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
        const pedidos = await respuesta.json();

        pedidosOriginales = pedidos;

        if (pedidos.length === 0) {
            pedidosFiltrados = [];
            estadoVacio.style.display = 'block';
            contador.textContent = '0 pedidos';
        } else {
            aplicarFiltros();
        }
    } catch (error) {
        console.error('Error al cargar pedidos:', error);
        tbody.innerHTML = '';
        pedidosFiltrados = [];
        estadoVacio.style.display = 'block';
        estadoVacio.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="color:#d9534f"></i>
            <p>No se pudieron cargar los pedidos</p>
            <small>Verificá que el servidor esté corriendo e intentá de nuevo.</small>
        `;
    } finally {
        estadoCargando.style.display = 'none';
        icono.classList.remove('spinning');
        btnRefresh.disabled = false;
    }
}

// ----- CAMBIO DE ESTADO -----

async function cambiarEstado(id, nuevoEstado, estadoAnterior, selectElement) {
    selectElement.disabled = true;

    try {
        const respuesta = await fetchAdmin(`${API_ADMIN_PEDIDOS}/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ estado: nuevoEstado }),
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            const badge = document.getElementById(`badge-${id}`);
            if (badge) {
                badge.className = `badge ${claseBadgeEstado(nuevoEstado)}`;
                badge.textContent = capitalizar(nuevoEstado);
            }
            selectElement.dataset.estadoAnterior = nuevoEstado;

            const pedido = pedidosOriginales.find((p) => String(p.id) === String(id));
            if (pedido) pedido.estado = nuevoEstado;

            mostrarToast(`✅ Estado actualizado a "${capitalizar(nuevoEstado)}"`);

            if (estadoFiltroActivo !== 'Todos') {
                setTimeout(aplicarFiltros, 400);
            } else {
                // Refrescar el array de exportación
                pedidosFiltrados = [...pedidosOriginales];
            }
        } else {
            selectElement.value = estadoAnterior;
            mostrarToast(`❌ Error: ${resultado.error || 'No se pudo actualizar'}`, true);
        }
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        selectElement.value = estadoAnterior;
        mostrarToast('❌ No se pudo conectar con el servidor', true);
    } finally {
        selectElement.disabled = false;
    }
}

// ----- EVENTOS -----

btnRefresh.addEventListener('click', cargarPedidos);
btnExportar.addEventListener('click', exportarCSV);

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

// ----- INICIO -----

document.addEventListener('DOMContentLoaded', () => {
    construirFiltrosEstado();
    setTimeout(cargarPedidos, 100);
});