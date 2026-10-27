// LOGICA DE LA PAGINA DE MIS PEDIDOS DEL USUARIO
// muestra reparaciones y compras, con filtros, buscador, cancelacion y repeticion

const API_PEDIDOS_USUARIO = '/api/usuarios/pedidos';

const usuarioSpan = document.getElementById('pedidos-usuario');
const btnExportarPDF = document.getElementById('btn-exportar-pdf');

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

// MODAL
const modalDetalle = document.getElementById('modal-detalle');
const modalClose = document.getElementById('modal-close');
const modalPedidoId = document.getElementById('modal-pedido-id');
const modalInfo = document.getElementById('modal-info');
const modalItems = document.getElementById('modal-items');
const modalTotal = document.getElementById('modal-total');
const modalAcciones = document.getElementById('modal-acciones');

const TIPOS = ['Todos', 'Reparacion', 'Compra'];
const ESTADOS = ['Todos', 'pendiente', 'en proceso', 'completado', 'cancelado'];

let pedidosActuales = [];
let tipoFiltroActivo = 'Todos';
let estadoFiltroActivo = 'Todos';
let textoBusqueda = '';
let pedidoDetalleActual = null;

// UTILIDADES DE SESION

// indica si hay una sesi?n de usuario activa.
function estaLogueadoUsuario() {
    return (
        sessionStorage.getItem('usuarioLogueado') === 'true' &&
        !!sessionStorage.getItem('usuarioToken')
    );
}

// obtiene los datos del usuario guardados en la sesi?n.
function obtenerUsuarioActual() {
    return sessionStorage.getItem('usuarioNombre') || '';
}

// obtiene el token de autenticaci?n del usuario.
function obtenerTokenUsuario() {
    return sessionStorage.getItem('usuarioToken') || '';
}

// elimina los datos de sesi?n del usuario.
function cerrarSesionUsuario() {
    sessionStorage.removeItem('usuarioLogueado');
    sessionStorage.removeItem('usuarioNombre');
    sessionStorage.removeItem('usuarioToken');
}

// UTILIDADES GENERALES

// escapa el texto para insertarlo de forma segura en HTML.
function escapar(texto) {
    if (texto === null || texto === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(texto);
    return div.innerHTML;
}

// formatea el precio como importe monetario.
function formatearPrecio(precio) {
    const num = Number(precio);
    if (isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
}

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

// indica si el pedido corresponde a una reparaci?n.
function esReparacion(pedido) {
    return (pedido.tipo || 'reparacion') === 'reparacion';
}

// muestra una notificaci?n temporal con el mensaje indicado.
function mostrarToast(mensaje, tipo = 'exito') {
    const anterior = document.getElementById('toast-publico');
    if (anterior) anterior.remove();

    const toast = document.createElement('div');
    toast.id = 'toast-publico';
    toast.className = `toast-publico toast-${tipo}`;
    toast.innerHTML = `<span>${mensaje}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('toast-visible'), 10);
    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// FILTROS

// crea los controles para filtrar los elementos por tipo.
function construirFiltrosTipo() {
    filtrosTipo.innerHTML = '';

    TIPOS.forEach((tipo) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'filtro-chip' + (tipo === tipoFiltroActivo ? ' active' : '');
        chip.dataset.tipo = tipo;

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

// crea los controles para filtrar los elementos por estado.
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

// actualiza el bot?n para reflejar si hay filtros activos.
function actualizarBotonLimpiar() {
    const hayFiltro =
        tipoFiltroActivo !== 'Todos' ||
        estadoFiltroActivo !== 'Todos' ||
        textoBusqueda.trim() !== '';
    btnLimpiar.disabled = !hayFiltro;
}

// filtra los elementos seg?n los criterios seleccionados.
function aplicarFiltros() {
    estadoVacio.style.display = 'none';
    estadoSinResultados.style.display = 'none';
    estadoError.style.display = 'none';

    let filtrados = [...pedidosActuales];

    if (tipoFiltroActivo === 'Reparacion') {
        filtrados = filtrados.filter((p) => esReparacion(p));
    } else if (tipoFiltroActivo === 'Compra') {
        filtrados = filtrados.filter((p) => !esReparacion(p));
    }

    if (estadoFiltroActivo !== 'Todos') {
        filtrados = filtrados.filter(
            (p) => (p.estado || 'pendiente').toLowerCase() === estadoFiltroActivo.toLowerCase()
        );
    }

    if (textoBusqueda.trim() !== '') {
        const q = textoBusqueda.trim().toLowerCase();
        filtrados = filtrados.filter((p) => {
            const numero = String(p.id).padStart(4, '0');
            const modelo = (p.modelo_celular || '').toLowerCase();
            const descripcion = (p.descripcion_problema || '').toLowerCase();
            return numero.includes(q) || modelo.includes(q) || descripcion.includes(q);
        });
    }

    if (pedidosActuales.length === 0) {
        estadoVacio.style.display = 'block';
        pedidosLista.style.display = 'none';
        pedidosContador.style.display = 'none';
        actualizarBotonLimpiar();
        return;
    }

    if (filtrados.length === 0) {
        estadoSinResultados.style.display = 'block';
        pedidosLista.style.display = 'none';
        pedidosContador.style.display = 'none';
        actualizarBotonLimpiar();
        return;
    }

    pedidosLista.style.display = 'flex';
    pedidosContador.style.display = 'block';
    actualizarContador(filtrados.length);

    renderizarPedidos(filtrados);
    actualizarBotonLimpiar();
}

// actualiza el contador de elementos mostrados.
function actualizarContador(cantidad) {
    contadorTexto.textContent = `${cantidad} pedido${cantidad !== 1 ? 's' : ''}`;
}

// RENDERIZADO

// muestra los pedidos con sus datos y acciones disponibles.
function renderizarPedidos(pedidos) {
    pedidosLista.innerHTML = '';

    pedidos.forEach((pedido) => {
        const card = document.createElement('article');
        card.className = 'pedido-card pedido-card-compacta';
        card.dataset.tipo = esReparacion(pedido) ? 'reparacion' : 'compra';
        card.dataset.id = pedido.id;

        card.innerHTML = esReparacion(pedido)
            ? generarCardReparacion(pedido)
            : generarCardCompra(pedido);

        pedidosLista.appendChild(card);
    });

    pedidosLista.querySelectorAll('.pedido-card-compacta').forEach((card) => {
        const header = card.querySelector('.pedido-compacto-header');
        if (!header) return;

        header.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            togglePedidoCard(card.dataset.id);
        });
    });

    pedidosLista.querySelectorAll('.pedido-btn-detalle').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            abrirModalDetalle(btn.dataset.id);
        });
    });

    pedidosLista.querySelectorAll('.pedido-btn-repetir-card').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            repetirPedido(btn.dataset.id);
        });
    });
}

// muestra u oculta el detalle de la tarjeta del pedido.
function togglePedidoCard(id) {
    if (window.innerWidth > 700) return;

    const cards = Array.from(pedidosLista.querySelectorAll('.pedido-card-compacta'));
    const card = cards.find((item) => item.dataset.id === String(id));
    if (!card) return;

    const estabaAbierta = card.classList.contains('pedido-card-abierta');
    cards.forEach((item) => item.classList.remove('pedido-card-abierta'));

    if (!estabaAbierta) {
        card.classList.add('pedido-card-abierta');
    }
}

// genera la tarjeta de un pedido de reparaci?n.
function generarCardReparacion(pedido) {
    const estadoActual = pedido.estado || 'pendiente';
    const pedidoIdFormateado = `#${String(pedido.id).padStart(4, '0')}`;
    const modelo = pedido.modelo_celular || '—';
    const descripcion = pedido.descripcion_problema || 'Sin descripcion';

    const tienePresupuesto = pedido.presupuesto !== null && pedido.presupuesto !== undefined;
    const presupuestoTexto = tienePresupuesto ? formatearPrecio(pedido.presupuesto) : 'A confirmar';

    return `
        <div class="pedido-compacto-header">
            <div class="pedido-compacto-linea1">
                <div class="pedido-compacto-titulo">
                    <i class="fas fa-tools"></i>
                    <strong>Reparacion ${pedidoIdFormateado}</strong>
                </div>
                <div class="pedido-compacto-badges">
                    <span class="badge ${claseBadgeEstado(estadoActual)}">
                        ${capitalizar(estadoActual)}
                    </span>
                    <span class="pedido-compacto-chevron">
                        <i class="fas fa-chevron-down"></i>
                    </span>
                </div>
            </div>
            <div class="pedido-compacto-linea2">
                <span class="pedido-compacto-dato">
                    <i class="fas fa-calendar-alt"></i>
                    ${formatearFecha(pedido.creado_en)}
                </span>
                <span class="pedido-compacto-dato">
                    <i class="fas fa-mobile-alt"></i>
                    ${escapar(modelo)}
                </span>
                <span class="pedido-compacto-dato pedido-compacto-dato-total">
                    ${presupuestoTexto}
                </span>
            </div>
        </div>

        <div class="pedido-compacto-detalle">
            <div class="pedido-detalle-linea pedido-detalle-linea-descripcion">
                <span class="pedido-detalle-label">Descripcion</span>
                <p class="pedido-detalle-texto">${escapar(descripcion)}</p>
            </div>
            <div class="pedido-detalle-linea">
                <span class="pedido-detalle-label">Fecha</span>
                <span class="pedido-detalle-valor">${formatearFecha(pedido.creado_en)}</span>
            </div>
            <div class="pedido-detalle-linea">
                <span class="pedido-detalle-label">Modelo</span>
                <span class="pedido-detalle-valor">${escapar(modelo)}</span>
            </div>
            <div class="pedido-detalle-linea">
                <span class="pedido-detalle-label">Presupuesto</span>
                <span class="pedido-detalle-valor ${tienePresupuesto ? '' : 'pedido-detalle-pendiente'}">
                    ${presupuestoTexto}
                </span>
            </div>
            <div class="pedido-compacto-acciones">
                <button type="button" class="pedido-btn-detalle" data-id="${escapar(pedido.id)}">
                    <i class="fas fa-eye"></i> Ver detalle
                </button>
            </div>
        </div>
    `;
}

// genera la tarjeta de un pedido de compra.
function generarCardCompra(pedido) {
    const estadoActual = pedido.estado || 'pendiente';
    const pedidoIdFormateado = `#${String(pedido.id).padStart(4, '0')}`;
    const totalItems = Number(pedido.total_items) || 0;
    const totalUnidades = Number(pedido.total_unidades) || 0;
    const totalPrecio = formatearPrecio(pedido.total_precio);

    const mostrarRepetir = estadoActual.toLowerCase() !== 'cancelado';
    const botonRepetir = mostrarRepetir
        ? `<button type="button" class="pedido-btn-repetir-card" data-id="${escapar(pedido.id)}">
               <i class="fas fa-redo"></i> Volver a pedir
           </button>`
        : '';

    return `
        <div class="pedido-compacto-header">
            <div class="pedido-compacto-linea1">
                <div class="pedido-compacto-titulo">
                    <i class="fas fa-shopping-bag"></i>
                    <strong>Compra ${pedidoIdFormateado}</strong>
                </div>
                <div class="pedido-compacto-badges">
                    <span class="badge ${claseBadgeEstado(estadoActual)}">
                        ${capitalizar(estadoActual)}
                    </span>
                    <span class="pedido-compacto-chevron">
                        <i class="fas fa-chevron-down"></i>
                    </span>
                </div>
            </div>
            <div class="pedido-compacto-linea2">
                <span class="pedido-compacto-dato">
                    <i class="fas fa-calendar-alt"></i>
                    ${formatearFecha(pedido.creado_en)}
                </span>
                <span class="pedido-compacto-dato">
                    <i class="fas fa-box"></i>
                    ${totalItems} producto${totalItems !== 1 ? 's' : ''}
                </span>
                <span class="pedido-compacto-dato pedido-compacto-dato-total">
                    ${totalPrecio}
                </span>
            </div>
        </div>

        <div class="pedido-compacto-detalle">
            <div class="pedido-detalle-linea">
                <span class="pedido-detalle-label">Fecha</span>
                <span class="pedido-detalle-valor">${formatearFecha(pedido.creado_en)}</span>
            </div>
            <div class="pedido-detalle-linea">
                <span class="pedido-detalle-label">Productos</span>
                <span class="pedido-detalle-valor">${totalItems}</span>
            </div>
            <div class="pedido-detalle-linea">
                <span class="pedido-detalle-label">Unidades</span>
                <span class="pedido-detalle-valor">${totalUnidades}</span>
            </div>
            <div class="pedido-detalle-linea">
                <span class="pedido-detalle-label">Total</span>
                <span class="pedido-detalle-valor pedido-detalle-total">${totalPrecio}</span>
            </div>
            <div class="pedido-compacto-acciones">
                ${botonRepetir}
                <button type="button" class="pedido-btn-detalle" data-id="${escapar(pedido.id)}">
                    <i class="fas fa-eye"></i> Ver detalle
                </button>
            </div>
        </div>
    `;
}

// EXPORTAR A PDF

// calcula la fecha correspondiente a la cantidad de meses indicada.
function fechaHaceMeses(meses) {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth() - meses, hoy.getDate());
}

// convierte la fecha al formato corto utilizado en la interfaz.
function formatearFechaCorta(fechaISO) {
    if (!fechaISO) return '—';
    const fecha = new Date(String(fechaISO).replace(' ', 'T'));
    if (Number.isNaN(fecha.getTime())) return String(fechaISO);

    const pad = (numero) => String(numero).padStart(2, '0');
    return `${pad(fecha.getDate())}/${pad(fecha.getMonth() + 1)}/${fecha.getFullYear()}`;
}

// construye el detalle del pedido que se incluir? en el PDF.
function detalleParaPDF(pedido) {
    if (esReparacion(pedido)) {
        const modelo = pedido.modelo_celular || 'Sin modelo';
        const descripcion = (pedido.descripcion_problema || '').trim();
        return descripcion ? `${modelo} - ${descripcion}` : modelo;
    }

    const productos = Number(pedido.total_items) || 0;
    const unidades = Number(pedido.total_unidades) || 0;
    return `${productos} producto${productos !== 1 ? 's' : ''} (${unidades} unidad${unidades !== 1 ? 'es' : ''})`;
}

// calcula el importe que se incluir? en el PDF.
function montoParaPDF(pedido) {
    if (esReparacion(pedido)) {
        if (pedido.presupuesto === null || pedido.presupuesto === undefined) {
            return 'A confirmar';
        }
        return formatearPrecio(pedido.presupuesto);
    }
    return formatearPrecio(pedido.total_precio);
}

// genera un PDF con los pedidos seleccionados.
async function exportarPedidosPDF() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        mostrarToast('No se pudo cargar la libreria de PDF. Revisa tu conexion.', 'error');
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
        console.warn('No se pudo obtener la marca para el PDF:', error.message);
    }

    const desde = fechaHaceMeses(6);
    const pedidosRecientes = pedidosActuales.filter((pedido) => {
        if (!pedido.creado_en) return false;
        const fecha = new Date(String(pedido.creado_en).replace(' ', 'T'));
        return !Number.isNaN(fecha.getTime()) && fecha >= desde;
    });

    if (pedidosRecientes.length === 0) {
        mostrarToast('No hay pedidos en los ultimos 6 meses para exportar.', 'error');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    if (typeof doc.autoTable !== 'function') {
        mostrarToast('No se pudo cargar el complemento de tablas PDF. Revisa tu conexion.', 'error');
        return;
    }

    const margenIzq = 14;
    const anchoPagina = doc.internal.pageSize.getWidth();

    doc.setFillColor(11, 74, 98);
    doc.rect(0, 0, anchoPagina, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(marca, margenIzq, 13);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Servicio tecnico y accesorios', margenIzq, 19);
    doc.text('Mis pedidos - Ultimos 6 meses', margenIzq, 24);

    const hoy = new Date();
    doc.setTextColor(11, 74, 98);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Usuario: ${obtenerUsuarioActual() || '—'}`, margenIzq, 38);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90, 107, 115);
    doc.text(
        `Rango: ${formatearFechaCorta(desde.toISOString())} al ${formatearFechaCorta(hoy.toISOString())}`,
        margenIzq,
        43
    );
    doc.text(
        `Generado el ${formatearFechaCorta(hoy.toISOString())}`,
        anchoPagina - margenIzq,
        43,
        { align: 'right' }
    );

    const filas = pedidosRecientes.map((pedido) => [
        `#${String(pedido.id).padStart(4, '0')}`,
        esReparacion(pedido) ? 'Reparacion' : 'Compra',
        formatearFechaCorta(pedido.creado_en),
        detalleParaPDF(pedido),
        capitalizar(pedido.estado || 'pendiente'),
        montoParaPDF(pedido),
    ]);

    doc.autoTable({
        startY: 50,
        head: [['Nro.', 'Tipo', 'Fecha', 'Detalle', 'Estado', 'Monto']],
        body: filas,
        theme: 'grid',
        styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 3,
            textColor: [51, 51, 51],
            lineColor: [224, 234, 240],
            lineWidth: 0.2,
            valign: 'middle',
        },
        headStyles: {
            fillColor: [11, 74, 98],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
            halign: 'left',
        },
        alternateRowStyles: {
            fillColor: [247, 254, 255],
        },
        columnStyles: {
            0: { cellWidth: 16, fontStyle: 'bold' },
            1: { cellWidth: 22 },
            2: { cellWidth: 22 },
            3: { cellWidth: 'auto' },
            4: { cellWidth: 24, halign: 'center' },
            5: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
        },
        didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 4) {
                const estado = String(data.cell.raw || '').toLowerCase();
                if (estado === 'pendiente') {
                    data.cell.styles.textColor = [133, 100, 4];
                } else if (estado === 'en proceso') {
                    data.cell.styles.textColor = [8, 66, 152];
                } else if (estado === 'completado') {
                    data.cell.styles.textColor = [15, 81, 50];
                } else if (estado === 'cancelado') {
                    data.cell.styles.textColor = [132, 32, 41];
                }
            }
        },
    });

    const compras = pedidosRecientes.filter((pedido) => !esReparacion(pedido));
    const reparaciones = pedidosRecientes.filter((pedido) => esReparacion(pedido));
    const totalCompras = compras.reduce(
        (acumulado, pedido) => acumulado + Number(pedido.total_precio || 0),
        0
    );

    let yFinal = doc.lastAutoTable.finalY + 12;
    const altoResumen = 32;
    if (yFinal + altoResumen > doc.internal.pageSize.getHeight() - 12) {
        doc.addPage();
        yFinal = 20;
    }

    doc.setFillColor(247, 254, 255);
    doc.setDrawColor(208, 230, 234);
    doc.setLineWidth(0.3);
    doc.roundedRect(margenIzq, yFinal, anchoPagina - margenIzq * 2, altoResumen, 3, 3, 'FD');

    doc.setTextColor(11, 74, 98);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen del periodo', margenIzq + 5, yFinal + 8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(85, 85, 85);
    doc.setFontSize(9);
    doc.text(`Total de pedidos: ${pedidosRecientes.length}`, margenIzq + 5, yFinal + 15);
    doc.text(`Reparaciones: ${reparaciones.length}`, margenIzq + 5, yFinal + 21);
    doc.text(`Compras: ${compras.length}`, margenIzq + 5, yFinal + 27);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 74, 98);
    doc.text(
        `Total gastado en compras: ${formatearPrecio(totalCompras)}`,
        anchoPagina - margenIzq - 5,
        yFinal + 21,
        { align: 'right' }
    );

    const totalPaginas = doc.internal.getNumberOfPages();
    for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
        doc.setPage(pagina);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(153, 153, 153);
        doc.text(
            `${marca} - Pagina ${pagina} de ${totalPaginas}`,
            anchoPagina / 2,
            doc.internal.pageSize.getHeight() - 8,
            { align: 'center' }
        );
    }

    const fechaArchivo = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    const marcaSlug = marca.toLowerCase().replace(/\s+/g, '-');
    doc.save(`mis-pedidos-${marcaSlug}-${fechaArchivo}.pdf`);
    mostrarToast(`Se exportaron ${pedidosRecientes.length} pedidos a PDF.`, 'exito');
}

// CARGAR PEDIDOS

// solicita los pedidos y actualiza la vista.
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

        construirFiltrosTipo();
        construirFiltrosEstado();
        aplicarFiltros();

        if (pedidosActuales.length > 0) {
            pedidosToolbar.style.display = 'flex';
        }
    } catch (error) {
        console.error('Error al cargar pedidos:', error);
        estadoError.style.display = 'block';
    } finally {
        estadoCargando.style.display = 'none';
        if (btnExportarPDF) {
            btnExportarPDF.disabled = pedidosActuales.length === 0;
        }
    }
}

// MODAL DE DETALLE

// muestra el detalle del pedido seleccionado.
async function abrirModalDetalle(pedidoId) {
    modalPedidoId.textContent = `#${String(pedidoId).padStart(4, '0')}`;
    modalInfo.innerHTML = '<p class="pedido-modal-cargando"><i class="fas fa-spinner fa-spin"></i> Cargando...</p>';
    modalItems.innerHTML = '';
    modalTotal.innerHTML = '';
    modalAcciones.innerHTML = '';
    pedidoDetalleActual = null;
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

        pedidoDetalleActual = data.pedido;

        if (esReparacion(data.pedido)) {
            renderizarDetalleReparacion(data.pedido);
        } else {
            renderizarDetalleCompra(data.pedido);
        }

        renderizarAccionesPedido(data.pedido);
    } catch (error) {
        console.error('Error al cargar detalle:', error);
        modalInfo.innerHTML = '<p class="pedido-modal-error">No se pudo conectar con el servidor.</p>';
    }
}

// RENDERIZA LOS BOTONES DE ACCION DEL MODAL
// "Cancelar" solo si esta pendiente
// muestra las acciones permitidas para el pedido.
function renderizarAccionesPedido(pedido) {
    const estado = (pedido.estado || 'pendiente').toLowerCase().trim();
    const botones = [];

    // BOTON REPETIR (solo compras no canceladas)
    if (!esReparacion(pedido) && estado !== 'cancelado') {
        botones.push(`
            <button type="button" class="pedido-btn-repetir" id="btn-repetir-pedido">
                <i class="fas fa-redo"></i> Volver a pedir
            </button>
        `);
    }

    // BOTON CANCELAR (solo si esta pendiente)
    if (estado === 'pendiente') {
        botones.push(`
            <button type="button" class="pedido-btn-cancelar" id="btn-cancelar-pedido">
                <i class="fas fa-times-circle"></i> Cancelar pedido
            </button>
        `);
    }

    // MENSAJE EXPLICATIVO SEGUN EL CASO
    let aclaracion = '';
    if (estado === 'pendiente' && !esReparacion(pedido)) {
        aclaracion = 'Podes cancelar el pedido o volver a pedir los mismos productos.';
    } else if (estado === 'pendiente') {
        aclaracion = 'Podes cancelar el pedido mientras este pendiente.';
    } else if (!esReparacion(pedido) && estado !== 'cancelado') {
        aclaracion = 'Podes volver a pedir los mismos productos.';
    }

    if (botones.length === 0) {
        modalAcciones.innerHTML = '';
        return;
    }

    modalAcciones.innerHTML = `
        <div class="pedido-modal-botones">
            ${botones.join('')}
        </div>
        ${aclaracion ? `<p class="pedido-modal-aclaracion"><i class="fas fa-info-circle"></i> ${aclaracion}</p>` : ''}
    `;

    // ASIGNAR EVENTOS
    const btnRepetir = document.getElementById('btn-repetir-pedido');
    if (btnRepetir) {
        btnRepetir.addEventListener('click', () => repetirPedido(pedido.id));
    }

    const btnCancelar = document.getElementById('btn-cancelar-pedido');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => cancelarPedido(pedido.id));
    }
}

// muestra los datos espec?ficos de la reparaci?n.
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

    const tienePresupuesto = pedido.presupuesto !== null && pedido.presupuesto !== undefined;

    if (tienePresupuesto) {
        modalTotal.innerHTML = `
            <div class="pedido-modal-total-linea pedido-modal-total-final">
                <span>Presupuesto</span>
                <strong>${formatearPrecio(pedido.presupuesto)}</strong>
            </div>
            <p class="pedido-modal-aclaracion">
                <i class="fas fa-info-circle"></i>
                Este es el monto estimado para la reparacion. Puede variar segun la revision final.
            </p>
        `;
    } else {
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
}

// muestra los datos espec?ficos de la compra.
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

// cierra la ventana con el detalle del pedido.
function cerrarModalDetalle() {
    modalDetalle.classList.remove('modal-visible');
    pedidoDetalleActual = null;
}

// CANCELAR PEDIDO

// solicita la cancelaci?n del pedido seleccionado.
async function cancelarPedido(pedidoId) {
    const confirmar = confirm(
        'Estas seguro de que queres cancelar este pedido?\n\n' +
        'Esta accion no se puede revertir.'
    );
    if (!confirmar) return;

    const btnCancelar = document.getElementById('btn-cancelar-pedido');
    if (btnCancelar) {
        btnCancelar.disabled = true;
        btnCancelar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cancelando...';
    }

    try {
        const respuesta = await fetch(`${API_PEDIDOS_USUARIO}/${pedidoId}/cancelar`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${obtenerTokenUsuario()}`,
            },
        });

        if (respuesta.status === 401) {
            cerrarSesionUsuario();
            window.location.href = '/user/login.html';
            return;
        }

        const resultado = await respuesta.json();

        if (resultado.success) {
            mostrarToast('Pedido cancelado correctamente.', 'exito');
            cerrarModalDetalle();
            cargarPedidos();
        } else {
            mostrarToast(resultado.error || 'No se pudo cancelar el pedido.', 'error');
            if (btnCancelar) {
                btnCancelar.disabled = false;
                btnCancelar.innerHTML = '<i class="fas fa-times-circle"></i> Cancelar pedido';
            }
        }
    } catch (error) {
        console.error('Error al cancelar pedido:', error);
        mostrarToast('No se pudo conectar con el servidor.', 'error');
        if (btnCancelar) {
            btnCancelar.disabled = false;
            btnCancelar.innerHTML = '<i class="fas fa-times-circle"></i> Cancelar pedido';
        }
    }
}

// REPETIR PEDIDO

// agrega nuevamente al carrito los productos del pedido.
async function repetirPedido(pedidoId) {
    // IDENTIFICAR EL BOTON QUE DISPARO LA ACCION (puede estar en la tarjeta o en el modal)
    const btnModal = document.getElementById('btn-repetir-pedido');
    const btnCard = document.querySelector(`.pedido-btn-repetir-card[data-id="${pedidoId}"]`);

    // guardar el contenido original de cada boton para restaurarlo despues
    const contenidoModal = btnModal ? btnModal.innerHTML : null;
    const contenidoCard = btnCard ? btnCard.innerHTML : null;

    if (btnModal) {
        btnModal.disabled = true;
        btnModal.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Agregando...';
    }
    if (btnCard) {
        btnCard.disabled = true;
        btnCard.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }

    try {
        const respuesta = await fetch(`${API_PEDIDOS_USUARIO}/${pedidoId}/repetir`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${obtenerTokenUsuario()}`,
            },
        });

        if (respuesta.status === 401) {
            cerrarSesionUsuario();
            window.location.href = '/user/login.html';
            return;
        }

        const resultado = await respuesta.json();

        if (resultado.success) {
            // CERRAR EL MODAL SI ESTABA ABIERTO
            cerrarModalDetalle();

            // ARMAR MENSAJE
            const cantidad = resultado.agregados || 0;
            let mensaje = `Se agregaron ${cantidad} producto${cantidad !== 1 ? 's' : ''} al carrito.`;

            if (resultado.omitidos && resultado.omitidos.length > 0) {
                mensaje += '\n\nProductos omitidos:\n- ' + resultado.omitidos.join('\n- ');
            }

            mensaje += '\n\nQueres ir al carrito ahora?';

            const irAlCarrito = confirm(mensaje);
            if (irAlCarrito) {
                window.location.href = '/user/carrito.html';
                return;
            }

            mostrarToast('Productos agregados al carrito.', 'exito');
        } else {
            // si el error trae detalle de omitidos, lo mostramos
            let mensaje = resultado.error || 'No se pudo repetir el pedido.';
            if (resultado.omitidos && resultado.omitidos.length > 0) {
                mensaje += '\n\n' + resultado.omitidos.join('\n');
            }
            alert(mensaje);
        }
    } catch (error) {
        console.error('Error al repetir pedido:', error);
        mostrarToast('No se pudo conectar con el servidor.', 'error');
    } finally {
        if (btnModal) {
            btnModal.disabled = false;
            btnModal.innerHTML = contenidoModal;
        }
        if (btnCard) {
            btnCard.disabled = false;
            btnCard.innerHTML = contenidoCard;
        }
    }
}

// EVENTOS DEL MODAL

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

if (btnExportarPDF) {
    btnExportarPDF.addEventListener('click', exportarPedidosPDF);
}

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