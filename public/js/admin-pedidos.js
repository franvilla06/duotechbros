// LÓGICA DE LA PÁGINA "VER PEDIDOS" - DUOTECHBROS ADMIN
// incluye: ver, cambiar estado, notas internas, buscar, filtrar,
// ordenar, paginar y exportar csv

const API_PEDIDOS = '/api/pedidos';
const API_ADMIN_PEDIDOS = '/api/admin/pedidos';

const tbody = document.getElementById('tbody-pedidos');
const contador = document.getElementById('contador-pedidos');
const estadoVacio = document.getElementById('estado-vacio');
const estadoSinResultados = document.getElementById('estado-sin-resultados');
const estadoCargando = document.getElementById('estado-cargando');
const btnRefresh = document.getElementById('btn-refresh');
const btnExportar = document.getElementById('btn-exportar');

const buscador = document.getElementById('buscador-pedidos');
const filtrosEstado = document.getElementById('filtros-estado');
const btnLimpiar = document.getElementById('btn-limpiar');

// MODAL DE NOTAS
const modalNotas = document.getElementById('modal-notas');
const modalNotasClose = document.getElementById('modal-notas-close');
const notasInfo = document.getElementById('notas-info');
const editNotas = document.getElementById('edit-notas');
const btnNotasCancelar = document.getElementById('btn-notas-cancelar');
const btnNotasGuardar = document.getElementById('btn-notas-guardar');

const ESTADOS = ['pendiente', 'en proceso', 'completado', 'cancelado'];
const POR_PAGINA = 10;

// ESTADO LOCAL
let pedidosOriginales = [];
let pedidosFiltrados = [];
let estadoFiltroActivo = 'Todos';
let textoBusqueda = '';
let ordenActual = { campo: null, tipo: null, direccion: 'asc' };
let paginador = null;

// pedido actualmente abierto en el modal de notas
let pedidoNotasActual = null;

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

// EXPORTAR A CSV

function escaparCSV(valor) {
    if (valor === null || valor === undefined) return '';
    const texto = String(valor);
    if (texto.includes(',') || texto.includes('"') || texto.includes('\n') || texto.includes('\r')) {
        return `"${texto.replace(/"/g, '""')}"`;
    }
    return texto;
}

function exportarCSV() {
    if (pedidosFiltrados.length === 0) {
        mostrarToast('No hay pedidos para exportar.', true);
        return;
    }

    const encabezados = [
        'ID',
        'Nombre del cliente',
        'Teléfono',
        'Email',
        'Modelo del celular',
        'Descripción del problema',
        'Estado',
        'Notas internas',
        'Fecha de creación',
    ];

    const filas = pedidosFiltrados.map((p) => [
        p.id,
        p.nombre_cliente,
        p.telefono,
        p.email,
        p.modelo_celular,
        p.descripcion_problema,
        capitalizar(p.estado || 'pendiente'),
        p.notas || '',
        formatearFecha(p.creado_en),
    ]);

    const lineas = [
        encabezados.map(escaparCSV).join(','),
        ...filas.map((fila) => fila.map(escaparCSV).join(',')),
    ];

    const contenido = lineas.join('\r\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + contenido], { type: 'text/csv;charset=utf-8;' });

    const hoy = new Date();
    const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    const nombreArchivo = `pedidos-duotechbros-${fecha}.csv`;

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

    const itemsPagina = paginador ? paginador.getItems(pedidos) : pedidos;

    itemsPagina.forEach((p) => {
        const estadoActual = p.estado || 'pendiente';
        const tieneNotas = p.notas && p.notas.trim() !== '';

        const opciones = ESTADOS.map(
            (e) => `<option value="${e}" ${e === estadoActual ? 'selected' : ''}>${capitalizar(e)}</option>`
        ).join('');

        const claseBotonNotas = tieneNotas ? 'btn-notas tiene-notas' : 'btn-notas';
        const tituloBotonNotas = tieneNotas ? 'Ver/editar notas (tiene notas)' : 'Agregar notas';
        const iconoNotas = tieneNotas ? 'fa-solid fa-note-sticky' : 'fa-regular fa-note-sticky';

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
                <button class="${claseBotonNotas}" title="${tituloBotonNotas}" data-id="${p.id}">
                    <i class="${iconoNotas}"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // EVENTOS DE LOS SELECTS DE ESTADO
    tbody.querySelectorAll('.estado-select').forEach((select) => {
        select.addEventListener('change', () => {
            const id = select.dataset.id;
            const nuevoEstado = select.value;
            const estadoAnterior = select.dataset.estadoAnterior;
            if (nuevoEstado === estadoAnterior) return;
            cambiarEstado(id, nuevoEstado, estadoAnterior, select);
        });
    });

    // EVENTOS DE LOS BOTONES DE NOTAS
    tbody.querySelectorAll('.btn-notas').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            abrirModalNotas(id);
        });
    });
}

// APLICAR FILTROS + ORDEN + PAGINACIÓN

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

    filtrados = aplicarOrdenamiento(filtrados);
    pedidosFiltrados = filtrados;

    if (paginador) paginador.actualizar(pedidosFiltrados.length, true);

    actualizarBotonLimpiar();
    renderizarPedidos(pedidosFiltrados);
}

// CARGA DE DATOS

async function cargarPedidos() {
    estadoCargando.style.display = 'block';
    estadoVacio.style.display = 'none';
    estadoSinResultados.style.display = 'none';
    tbody.innerHTML = '';

    const icono = btnRefresh.querySelector('i');
    icono.classList.add('spinning');
    btnRefresh.disabled = true;

    try {
        const respuesta = await fetch(`${API_PEDIDOS}?tipo=reparacion`);
        if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
        const pedidos = await respuesta.json();

        pedidosOriginales = pedidos;

        if (pedidos.length === 0) {
            pedidosFiltrados = [];
            estadoVacio.style.display = 'block';
            contador.textContent = '0 pedidos';
            if (paginador) paginador.actualizar(0, true);
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

// CAMBIO DE ESTADO

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

            // volver a renderizar sin resetear la página
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
            filtrados = aplicarOrdenamiento(filtrados);
            pedidosFiltrados = filtrados;
            if (paginador) paginador.actualizar(filtrados.length, false);
            renderizarPedidos(pedidosFiltrados);
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

// MODAL: NOTAS INTERNAS

function abrirModalNotas(id) {
    const pedido = pedidosOriginales.find((p) => String(p.id) === String(id));
    if (!pedido) {
        mostrarToast('No se encontró el pedido.', true);
        return;
    }

    pedidoNotasActual = pedido;

    // rellenar la info del pedido
    notasInfo.innerHTML = `
        <div class="notas-info-linea">
            <span class="notas-info-label">Cliente</span>
            <span class="notas-info-valor">${escapar(pedido.nombre_cliente)}</span>
        </div>
        <div class="notas-info-linea">
            <span class="notas-info-label">Modelo</span>
            <span class="notas-info-valor">${escapar(pedido.modelo_celular)}</span>
        </div>
        <div class="notas-info-linea">
            <span class="notas-info-label">Estado</span>
            <span class="badge ${claseBadgeEstado(pedido.estado || 'pendiente')}">
                ${capitalizar(pedido.estado || 'pendiente')}
            </span>
        </div>
        <div class="notas-info-linea">
            <span class="notas-info-label">Recibido</span>
            <span class="notas-info-valor">${formatearFecha(pedido.creado_en)}</span>
        </div>
    `;

    // rellenar el textarea con la nota actual
    editNotas.value = pedido.notas || '';

    // mostrar el modal
    modalNotas.classList.add('modal-visible');
    editNotas.focus();
}

function cerrarModalNotas() {
    modalNotas.classList.remove('modal-visible');
    editNotas.value = '';
    pedidoNotasActual = null;
}

async function guardarNotas() {
    if (!pedidoNotasActual) return;

    const id = pedidoNotasActual.id;
    const notas = editNotas.value.trim();

    btnNotasGuardar.disabled = true;
    btnNotasGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    try {
        const respuesta = await fetchAdmin(`${API_ADMIN_PEDIDOS}/${id}/notas`, {
            method: 'PUT',
            body: JSON.stringify({ notas }),
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            // actualizar el pedido en el estado local
            pedidoNotasActual.notas = resultado.notas;

            const mensaje = resultado.notas
                ? '✅ Nota guardada correctamente.'
                : '✅ Nota eliminada.';
            mostrarToast(mensaje);

            cerrarModalNotas();
            renderizarPedidos(pedidosFiltrados);
        } else {
            mostrarToast(`❌ Error: ${resultado.error || 'No se pudo guardar la nota.'}`, true);
        }
    } catch (error) {
        console.error('Error al guardar notas:', error);
        mostrarToast('❌ No se pudo conectar con el servidor', true);
    } finally {
        btnNotasGuardar.disabled = false;
        btnNotasGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar Nota';
    }
}

// EVENTOS DEL MODAL DE NOTAS
modalNotasClose.addEventListener('click', cerrarModalNotas);
btnNotasCancelar.addEventListener('click', cerrarModalNotas);
btnNotasGuardar.addEventListener('click', guardarNotas);

modalNotas.addEventListener('click', (e) => {
    if (e.target === modalNotas) cerrarModalNotas();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalNotas.classList.contains('modal-visible')) {
        cerrarModalNotas();
    }
});

// EVENTOS GENERALES

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

// INICIO

document.addEventListener('DOMContentLoaded', () => {
    paginador = crearPaginador('paginacion-pedidos', POR_PAGINA, () => {
        renderizarPedidos(pedidosFiltrados);
    });

    construirFiltrosEstado();

    configurarColumnasOrdenables(
        'tabla-pedidos',
        {
            0: { campo: 'nombre_cliente', tipo: 'string' },
            1: { campo: 'email', tipo: 'string' },
            2: { campo: 'modelo_celular', tipo: 'string' },
            3: { campo: 'descripcion_problema', tipo: 'string' },
            4: { campo: 'creado_en', tipo: 'fecha' },
            5: { campo: 'estado', tipo: 'string' },
        },
        () => ordenActual,
        (nuevo) => { ordenActual = nuevo; },
        aplicarFiltros
    );

    setTimeout(cargarPedidos, 100);
});