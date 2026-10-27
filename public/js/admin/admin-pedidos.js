// LOGICA DE LA PAGINA "PEDIDOS DE REPARACION" - DUOTECHBROS ADMIN
// INCLUYE: VER, CAMBIAR ESTADO, NOTAS INTERNAS, PRESUPUESTO, BUSCAR,
// FILTRAR, ORDENAR, PAGINAR Y EXPORTAR CSV

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
const filtroTiempoTabla = document.getElementById('filtro-tiempo-tabla');
const filtrosEstado = document.getElementById('filtros-estado');
const btnLimpiar = document.getElementById('btn-limpiar');

// modal de notas + presupuesto
const modalNotas = document.getElementById('modal-notas');
const modalNotasClose = document.getElementById('modal-notas-close');
const notasInfo = document.getElementById('notas-info');
const editNotas = document.getElementById('edit-notas');
const editPresupuesto = document.getElementById('edit-presupuesto');
const btnNotasCancelar = document.getElementById('btn-notas-cancelar');
const btnNotasGuardar = document.getElementById('btn-notas-guardar');

const ESTADOS = ['pendiente', 'en proceso', 'completado', 'cancelado'];
const POR_PAGINA = 10;

let pedidosOriginales = [];
let pedidosFiltrados = [];
let estadoFiltroActivo = 'Todos';
let tiempoFiltroActivo = 'todos';
let textoBusqueda = '';
let ordenActual = { campo: null, tipo: null, direccion: 'asc' };
let paginador = null;
let pedidoNotasActual = null;

// UTILIDADES

// convierte la fecha al formato utilizado en la interfaz.
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

// formatea el precio como importe monetario.
function formatearPrecio(precio) {
    const num = Number(precio);
    if (isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
}

// escapa el texto para insertarlo de forma segura en HTML.
function escapar(texto) {
    if (texto === null || texto === undefined) return '—';
    const div = document.createElement('div');
    div.textContent = String(texto);
    return div.innerHTML;
}

// unifica el formato del estado para facilitar su comparaci?n.
function normalizarEstado(estado) {
    return (estado || 'pendiente').toLowerCase().trim().replace(/\s+/g, '-');
}

// elige la clase visual del distintivo seg?n el estado.
function claseBadgeEstado(estado) {
    const e = normalizarEstado(estado);
    const validos = ['pendiente', 'en-proceso', 'completado', 'cancelado'];
    return validos.includes(e) ? `badge-${e}` : 'badge-pendiente';
}

// convierte la primera letra del texto a may?scula.
function capitalizar(texto) {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// muestra una notificaci?n temporal con el mensaje indicado.
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

// ordena los elementos seg?n los criterios seleccionados.
function aplicarOrdenamiento(array) {
    if (!ordenActual.campo) return array;
    return [...array].sort((a, b) => {
        const cmp = compararValores(a[ordenActual.campo], b[ordenActual.campo], ordenActual.tipo);
        return ordenActual.direccion === 'asc' ? cmp : -cmp;
    });
}

// EXPORTAR A CSV

// escapa los valores para conservar el formato del archivo CSV.
function escaparCSV(valor) {
    if (valor === null || valor === undefined) return '';
    let texto = String(valor);

    if (/^[=+\-@\t\r]/.test(texto)) {
        texto = "'" + texto;
    }

    if (texto.includes(',') || texto.includes('"') || texto.includes('\n') || texto.includes('\r')) {
        return `"${texto.replace(/"/g, '""')}"`;
    }
    return texto;
}

// descarga los datos visibles en un archivo CSV.
async function exportarCSV() {
    if (pedidosFiltrados.length === 0) {
        mostrarToast('No hay pedidos para exportar.', true);
        return;
    }

    let marca = 'DuotechBros';
    try {
        const resConfig = await fetch('/api/configuracion');
        if (resConfig.ok) {
            const config = await resConfig.json();
            marca = config.marca_nombre || 'DuotechBros';
        }
    } catch (error) {
        console.warn('No se pudo obtener la marca:', error.message);
    }

    const encabezados = [
        'ID',
        'Nombre del cliente',
        'Teléfono',
        'Email',
        'Modelo del celular',
        'Descripción del problema',
        'Estado',
        'Presupuesto',
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
        p.presupuesto !== null && p.presupuesto !== undefined ? formatearPrecio(p.presupuesto) : '',
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
    const marcaSlug = marca.toLowerCase().replace(/\s+/g, '-');
    const nombreArchivo = `pedidos-${marcaSlug}-${fecha}.csv`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    mostrarToast(`Se exportaron ${pedidosFiltrados.length} pedido${pedidosFiltrados.length !== 1 ? 's' : ''} a CSV.`);
}

// FILTROS

// crea los controles para filtrar los elementos por estado.
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

// actualiza el bot?n para reflejar si hay filtros activos.
function actualizarBotonLimpiar() {
    const hayFiltro =
        estadoFiltroActivo !== 'Todos' ||
        tiempoFiltroActivo !== 'todos' ||
        textoBusqueda.trim() !== '';
    btnLimpiar.disabled = !hayFiltro;
}

// RENDERIZADO

// muestra los pedidos con sus datos y acciones disponibles.
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
        const esCancelado = estadoActual.toLowerCase().trim() === 'cancelado';
        const tieneNotas = p.notas && p.notas.trim() !== '';
        const tienePresupuesto = p.presupuesto !== null && p.presupuesto !== undefined;
        const badgeId = `badge-${p.id}`;

        const opciones = esCancelado
            ? '<option value="cancelado" selected>Cancelado</option>'
            : ESTADOS.map(
                  (e) => `<option value="${e}" ${e === estadoActual ? 'selected' : ''}>${capitalizar(e)}</option>`
              ).join('');

        let claseBotonNotas = 'btn-notas';
        if (tieneNotas || tienePresupuesto) claseBotonNotas += ' tiene-notas';

        const tituloBotonNotas = tieneNotas || tienePresupuesto
            ? 'Ver/editar notas y presupuesto'
            : 'Agregar notas o presupuesto';

        const iconoNotas = tieneNotas || tienePresupuesto
            ? 'fas fa-sticky-note'
            : 'far fa-sticky-note';

        const nombreCliente = escapar(p.nombre_cliente);
        const email = escapar(p.email);
        const telefono = escapar(p.telefono);
        const modelo = escapar(p.modelo_celular);
        const descripcion = escapar(p.descripcion_problema);
        const fechaFormateada = formatearFecha(p.creado_en);

        const tr = document.createElement('tr');
        tr.className = 'pedido-fila';
        tr.dataset.id = p.id;
        tr.innerHTML = `
            <td class="pedido-celda-cliente"><span class="cell-nombre">${nombreCliente}</span></td>
            <td class="pedido-celda-contacto">
                <div class="cell-email">${email}</div>
                <div class="cell-telefono">${telefono}</div>
            </td>
            <td class="pedido-celda-modelo">${modelo}</td>
            <td class="pedido-celda-descripcion">
                <div class="cell-descripcion" title="${descripcion}">${descripcion}</div>
            </td>
            <td class="pedido-celda-fecha"><span class="cell-fecha">${fechaFormateada}</span></td>
            <td class="pedido-celda-estado">
                <span class="badge ${claseBadgeEstado(estadoActual)}" id="${badgeId}">
                    ${capitalizar(estadoActual)}
                </span>
            </td>
            <td class="cell-acciones" style="text-align: right">
                <div class="cell-acciones-contenido">
                    <select class="estado-select" data-id="${p.id}" data-estado-anterior="${estadoActual}" ${esCancelado ? 'disabled' : ''}>
                        ${opciones}
                    </select>
                    <button class="${claseBotonNotas}" title="${tituloBotonNotas}" data-id="${p.id}">
                        <i class="${iconoNotas}"></i>
                    </button>
                </div>
                <span class="fila-chevron"><i class="fas fa-chevron-down"></i></span>
            </td>
        `;

        const trDetalle = document.createElement('tr');
        trDetalle.className = 'pedido-detalle-fila';
        trDetalle.dataset.id = p.id;
        trDetalle.innerHTML = `
            <td colspan="7">
                <div class="fila-detalle-contenido">
                    <div class="fila-detalle-linea">
                        <span class="fila-detalle-label">Cliente</span>
                        <span class="fila-detalle-valor">${nombreCliente}</span>
                    </div>
                    <div class="fila-detalle-linea">
                        <span class="fila-detalle-label">Email</span>
                        <span class="fila-detalle-valor">${email}</span>
                    </div>
                    <div class="fila-detalle-linea">
                        <span class="fila-detalle-label">Teléfono</span>
                        <span class="fila-detalle-valor">${telefono}</span>
                    </div>
                    <div class="fila-detalle-linea">
                        <span class="fila-detalle-label">Modelo</span>
                        <span class="fila-detalle-valor">${modelo}</span>
                    </div>
                    <div class="fila-detalle-linea fila-detalle-linea-descripcion">
                        <span class="fila-detalle-label">Descripción</span>
                        <span class="fila-detalle-valor">${descripcion}</span>
                    </div>
                    <div class="fila-detalle-linea">
                        <span class="fila-detalle-label">Fecha</span>
                        <span class="fila-detalle-valor">${fechaFormateada}</span>
                    </div>
                    <div class="fila-detalle-acciones-vertical">
                        <div class="fila-detalle-campo">
                            <label class="fila-detalle-campo-label">Estado</label>
                            <select class="estado-select" data-id="${p.id}" data-estado-anterior="${estadoActual}" ${esCancelado ? 'disabled' : ''}>
                                ${opciones}
                            </select>
                        </div>
                        <button class="${claseBotonNotas}" title="${tituloBotonNotas}" data-id="${p.id}">
                            <i class="${iconoNotas}"></i> Notas y presupuesto
                        </button>
                    </div>
                </div>
            </td>
        `;

        tr.addEventListener('click', (e) => {
            if (e.target.closest('button') || e.target.closest('select')) return;
            toggleDetallePedido(p.id);
        });

        tbody.appendChild(tr);
        tbody.appendChild(trDetalle);
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

    tbody.querySelectorAll('.btn-notas').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            abrirModalNotas(btn.dataset.id);
        });
    });
}

// muestra u oculta el detalle del pedido seleccionado.
function toggleDetallePedido(id) {
    if (window.innerWidth > 700) return;

    const filaPrincipal = tbody.querySelector(`.pedido-fila[data-id="${id}"]`);
    const filaDetalle = tbody.querySelector(`.pedido-detalle-fila[data-id="${id}"]`);
    if (!filaPrincipal || !filaDetalle) return;

    const estabaAbierta = filaDetalle.classList.contains('fila-detalle-visible');

    tbody.querySelectorAll('.pedido-detalle-fila').forEach((fila) => {
        fila.classList.remove('fila-detalle-visible');
    });
    tbody.querySelectorAll('.pedido-fila').forEach((fila) => {
        fila.classList.remove('fila-abierta');
    });

    if (!estabaAbierta) {
        filaDetalle.classList.add('fila-detalle-visible');
        filaPrincipal.classList.add('fila-abierta');
    }
}

// APLICAR FILTROS

// filtra los elementos seg?n los criterios seleccionados.
function aplicarFiltros() {
    estadoVacio.style.display = 'none';
    estadoSinResultados.style.display = 'none';

    const baseFiltrada = filtrarPorRangoTiempo(pedidosOriginales, tiempoFiltroActivo);
    let filtrados = [...baseFiltrada];

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

// solicita los pedidos y actualiza la vista.
async function cargarPedidos() {
    estadoCargando.style.display = 'block';
    estadoVacio.style.display = 'none';
    estadoSinResultados.style.display = 'none';
    tbody.innerHTML = '';

    const icono = btnRefresh.querySelector('i');
    icono.classList.add('spinning');
    btnRefresh.disabled = true;

    try {
        const respuesta = await fetchAdmin(`${API_PEDIDOS}?tipo=reparacion`);
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

// guarda el nuevo estado del elemento seleccionado.
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

            mostrarToast(`Estado actualizado a "${capitalizar(nuevoEstado)}"`);

            // VOLVER A RENDERIZAR SIN RESETEAR LA PAGINA
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
            mostrarToast(`Error: ${resultado.error || 'No se pudo actualizar'}`, true);
        }
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        selectElement.value = estadoAnterior;
        mostrarToast('No se pudo conectar con el servidor', true);
    } finally {
        selectElement.disabled = false;
    }
}

// MODAL: NOTAS + PRESUPUESTO

// muestra el formulario para editar las notas y el presupuesto.
function abrirModalNotas(id) {
    const pedido = pedidosOriginales.find((p) => String(p.id) === String(id));
    if (!pedido) {
        mostrarToast('No se encontró el pedido.', true);
        return;
    }

    pedidoNotasActual = pedido;

    // RELLENAR LA INFO DEL PEDIDO
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

    // RELLENAR CAMPOS
    editNotas.value = pedido.notas || '';
    editPresupuesto.value = pedido.presupuesto !== null && pedido.presupuesto !== undefined
        ? Number(pedido.presupuesto).toFixed(2)
        : '';

    modalNotas.classList.add('modal-visible');
    editPresupuesto.focus();
}

// cierra el formulario de notas y presupuesto.
function cerrarModalNotas() {
    modalNotas.classList.remove('modal-visible');
    editNotas.value = '';
    editPresupuesto.value = '';
    pedidoNotasActual = null;
}

// guarda las notas y el presupuesto del pedido.
async function guardarNotasYPresupuesto() {
    if (!pedidoNotasActual) return;

    const id = pedidoNotasActual.id;
    const notas = editNotas.value.trim();
    const presupuestoTexto = editPresupuesto.value.trim();

    // VALIDAR PRESUPUESTO SI SE CARGO
    let presupuestoValor = null;
    if (presupuestoTexto !== '') {
        const num = Number(presupuestoTexto);
        if (isNaN(num) || num < 0) {
            mostrarToast('El presupuesto debe ser un número mayor o igual a 0.', true);
            return;
        }
        presupuestoValor = Number(num.toFixed(2));
    }

    btnNotasGuardar.disabled = true;
    btnNotasGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    try {
        // GUARDAR PRESUPUESTO Y NOTAS EN PARALELO
        const [resPresupuesto, resNotas] = await Promise.all([
            fetchAdmin(`${API_ADMIN_PEDIDOS}/${id}/presupuesto`, {
                method: 'PUT',
                body: JSON.stringify({ presupuesto: presupuestoValor }),
            }),
            fetchAdmin(`${API_ADMIN_PEDIDOS}/${id}/notas`, {
                method: 'PUT',
                body: JSON.stringify({ notas }),
            }),
        ]);

        const resultadoPresupuesto = await resPresupuesto.json();
        const resultadoNotas = await resNotas.json();

        if (resultadoPresupuesto.success && resultadoNotas.success) {
            // ACTUALIZAR EL PEDIDO EN EL ESTADO LOCAL
            pedidoNotasActual.notas = resultadoNotas.notas;
            pedidoNotasActual.presupuesto = resultadoPresupuesto.presupuesto;

            mostrarToast('Cambios guardados correctamente.');

            cerrarModalNotas();
            renderizarPedidos(pedidosFiltrados);
        } else {
            const error = resultadoPresupuesto.error || resultadoNotas.error || 'No se pudo guardar.';
            mostrarToast(`Error: ${error}`, true);
        }
    } catch (error) {
        console.error('Error al guardar:', error);
        mostrarToast('No se pudo conectar con el servidor', true);
    } finally {
        btnNotasGuardar.disabled = false;
        btnNotasGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar';
    }
}

// EVENTOS DEL MODAL

modalNotasClose.addEventListener('click', cerrarModalNotas);
btnNotasCancelar.addEventListener('click', cerrarModalNotas);
btnNotasGuardar.addEventListener('click', guardarNotasYPresupuesto);

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

if (filtroTiempoTabla) {
    filtroTiempoTabla.addEventListener('change', (e) => {
        tiempoFiltroActivo = e.target.value;
        aplicarFiltros();
    });
}

btnLimpiar.addEventListener('click', () => {
    textoBusqueda = '';
    buscador.value = '';
    estadoFiltroActivo = 'Todos';
    tiempoFiltroActivo = 'todos';
    if (filtroTiempoTabla) filtroTiempoTabla.value = 'todos';
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