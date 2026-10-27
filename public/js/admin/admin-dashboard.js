// LOGICA DEL DASHBOARD - DUOTECHBROS ADMIN
// calcula estadisticas y renderiza los graficos con chart.js

const API_PEDIDOS = '/api/pedidos';
const API_PRODUCTOS = '/api/productos';
const API_PORTAFOLIO = '/api/portafolio';
const API_ESTADISTICAS = '/api/admin/estadisticas';

const btnRefresh = document.getElementById('btn-refresh');
const filtroTiempo = document.getElementById('filtro-tiempo');
const tbodyMovimientos = document.getElementById('tbody-movimientos');
const estadoVacio = document.getElementById('estado-vacio');
const contadorMovimientos = document.getElementById('contador-movimientos');

// COLORES REUTILIZABLES PARA LOS GRAFICOS
const COLORES = {
    azul: '#007bff',
    azulClaro: 'rgba(0, 123, 255, 0.15)',
    teal: '#0a9396',
    tealClaro: 'rgba(10, 147, 150, 0.15)',
    oscuro: '#0b4a62',
    verde: '#22c55e',
    amarillo: '#f59e0b',
    rojo: '#dc3545',
    gris: '#c0c7cd',
    grisClaro: '#e0eaf0',
};

// COLORES POR ESTADO (coherentes con los badges)
const COLORES_ESTADO = {
    pendiente: '#f59e0b',
    'en proceso': '#007bff',
    completado: '#22c55e',
    cancelado: '#dc3545',
};

// PALETA PARA LOS PRODUCTOS MAS VENDIDOS (se cicla)
const PALETA_PRODUCTOS = [
    '#007bff', '#0a9396', '#f59e0b', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#6366f1',
    '#22c55e', '#dc3545',
];

// guardamos las instancias de los graficos para poder destruirlos al refrescar
let graficoEstados = null;
let graficoVentas = null;
let graficoProductos = null;

// guardamos los ultimos datos del top de productos para re-renderizar en resize
let ultimosProductosData = [];

// UTILIDADES

// escapa el texto para insertarlo de forma segura en HTML.
function escapar(texto) {
    if (texto === null || texto === undefined) return '—';
    const div = document.createElement('div');
    div.textContent = String(texto);
    return div.innerHTML;
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

// formatea el precio como importe monetario.
function formatearPrecio(precio) {
    const num = Number(precio);
    if (isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
}

// convierte la primera letra del texto a may?scula.
function capitalizar(texto) {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// unifica el formato del estado para facilitar su comparaci?n.
function normalizarEstado(estado) {
    return (estado || 'pendiente').toLowerCase().trim();
}

// elige la clase visual del distintivo seg?n el estado.
function claseBadgeEstado(estado) {
    const e = normalizarEstado(estado).replace(/\s+/g, '-');
    const validos = ['pendiente', 'en-proceso', 'completado', 'cancelado'];
    return validos.includes(e) ? `badge-${e}` : 'badge-pendiente';
}

// indica si el pedido corresponde a una reparaci?n.
function esReparacion(pedido) {
    return (pedido.tipo || 'reparacion') === 'reparacion';
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

// RENDERIZADO DE ESTADISTICAS PRINCIPALES

// actualiza las tarjetas con los totales y estados principales.
function renderizarStats(reparaciones, compras, productos, portafolio) {
    document.getElementById('total-reparaciones').textContent = reparaciones.length;
    document.getElementById('total-compras').textContent = compras.length;
    document.getElementById('total-productos').textContent = productos.length;
    document.getElementById('total-portafolio').textContent = portafolio.length;

    // SUBTITULO DE REPARACIONES
    const pendientesRep = reparaciones.filter(
        (p) => normalizarEstado(p.estado) === 'pendiente'
    ).length;
    const subReparaciones = document.getElementById('sub-reparaciones');
    if (pendientesRep > 0) {
        subReparaciones.innerHTML = `<span class="sub-destacado">${pendientesRep}</span> pendiente${pendientesRep !== 1 ? 's' : ''}`;
    } else {
        subReparaciones.textContent = 'Sin pendientes';
    }

    // SUBTITULO DE COMPRAS
    const pendientesComp = compras.filter(
        (p) => normalizarEstado(p.estado) === 'pendiente'
    ).length;
    const subCompras = document.getElementById('sub-compras');
    if (pendientesComp > 0) {
        subCompras.innerHTML = `<span class="sub-destacado">${pendientesComp}</span> pendiente${pendientesComp !== 1 ? 's' : ''}`;
    } else {
        subCompras.textContent = 'Sin pendientes';
    }

    // SUBTITULO DE PRODUCTOS
    const stockBajo = productos.filter((p) => Number(p.stock) <= 3).length;
    const subProductos = document.getElementById('sub-productos');
    if (stockBajo > 0) {
        subProductos.innerHTML = `<span class="sub-alerta">${stockBajo}</span> con stock bajo`;
    } else {
        subProductos.textContent = 'Stock saludable';
    }

    // SUBTITULO DE PORTAFOLIO
    const subPortafolio = document.getElementById('sub-portafolio');
    if (portafolio.length > 0) {
        const ultimo = [...portafolio].sort((a, b) => {
            const fa = new Date((a.fecha || '').replace(' ', 'T')).getTime() || 0;
            const fb = new Date((b.fecha || '').replace(' ', 'T')).getTime() || 0;
            return fb - fa;
        })[0];

        if (ultimo && ultimo.fecha) {
            const fecha = new Date(ultimo.fecha.replace(' ', 'T'));
            if (!isNaN(fecha)) {
                const meses = [
                    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
                ];
                subPortafolio.textContent = `Último: ${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
            } else {
                subPortafolio.textContent = 'Publicados';
            }
        } else {
            subPortafolio.textContent = 'Publicados';
        }
    } else {
        subPortafolio.textContent = 'Sin publicar';
    }
}

// RENDERIZADO DE ULTIMOS MOVIMIENTOS

// muestra los movimientos m?s recientes del panel.
function renderizarUltimosMovimientos(pedidos) {
    tbodyMovimientos.innerHTML = '';

    if (pedidos.length === 0) {
        estadoVacio.style.display = 'block';
        contadorMovimientos.textContent = '0 movimientos';
        return;
    }

    estadoVacio.style.display = 'none';

    const ultimos = pedidos.slice(0, 8);

    contadorMovimientos.textContent = `${ultimos.length} de ${pedidos.length}`;

    ultimos.forEach((p) => {
        const estadoActual = p.estado || 'pendiente';
        const pedidoIdFormateado = `#${String(p.id).padStart(4, '0')}`;
        const esRep = esReparacion(p);

        // badges e iconos: el badge se ve en desktop, el icono en mobile
        const tipoBadge = esRep
            ? `<span class="mov-tipo-badge mov-tipo-reparacion"><i class="fas fa-tools"></i> Reparacion</span>`
            : `<span class="mov-tipo-badge mov-tipo-compra"><i class="fas fa-shopping-bag"></i> Compra</span>`;

        const tipoIcono = esRep
            ? `<span class="mov-tipo-icono mov-tipo-icono-reparacion"><i class="fas fa-tools"></i></span>`
            : `<span class="mov-tipo-icono mov-tipo-icono-compra"><i class="fas fa-shopping-bag"></i></span>`;

        const detalle = esRep
            ? escapar(p.modelo_celular || 'Sin modelo')
            : escapar(p.modelo_celular || 'Compra de accesorios');

        const nombreCliente = escapar(p.nombre_cliente);
        const fechaFormateada = formatearFecha(p.creado_en);

        // FILA PRINCIPAL (compacta en mobile, normal en desktop)
        const tr = document.createElement('tr');
        tr.className = 'mov-fila';
        tr.dataset.id = p.id;
        tr.innerHTML = `
            <td class="mov-celda-tipo">${tipoBadge}${tipoIcono}</td>
            <td class="mov-celda-nro"><span class="cell-nombre">${pedidoIdFormateado}</span></td>
            <td class="mov-celda-cliente">${nombreCliente}</td>
            <td class="mov-celda-detalle">
                <div class="cell-descripcion" title="${detalle}">${detalle}</div>
            </td>
            <td class="mov-celda-fecha"><span class="cell-fecha">${fechaFormateada}</span></td>
            <td class="mov-celda-estado">
                <span class="badge ${claseBadgeEstado(estadoActual)}">
                    ${capitalizar(estadoActual)}
                </span>
                <span class="mov-chevron"><i class="fas fa-chevron-down"></i></span>
            </td>
        `;

        // FILA DE DETALLE (oculta por defecto, se muestra al hacer click en mobile)
        const trDetalle = document.createElement('tr');
        trDetalle.className = 'mov-detalle-fila';
        trDetalle.dataset.id = p.id;
        trDetalle.innerHTML = `
            <td colspan="6">
                <div class="mov-detalle-contenido">
                    <div class="mov-detalle-linea">
                        <span class="mov-detalle-label">Tipo</span>
                        <span class="mov-detalle-valor">${tipoBadge}</span>
                    </div>
                    <div class="mov-detalle-linea">
                        <span class="mov-detalle-label">Nro.</span>
                        <span class="mov-detalle-valor">${pedidoIdFormateado}</span>
                    </div>
                    <div class="mov-detalle-linea">
                        <span class="mov-detalle-label">Cliente</span>
                        <span class="mov-detalle-valor">${nombreCliente}</span>
                    </div>
                    <div class="mov-detalle-linea">
                        <span class="mov-detalle-label">Detalle</span>
                        <span class="mov-detalle-valor">${detalle}</span>
                    </div>
                    <div class="mov-detalle-linea">
                        <span class="mov-detalle-label">Fecha</span>
                        <span class="mov-detalle-valor">${fechaFormateada}</span>
                    </div>
                    <div class="mov-detalle-linea">
                        <span class="mov-detalle-label">Estado</span>
                        <span class="badge ${claseBadgeEstado(estadoActual)}">${capitalizar(estadoActual)}</span>
                    </div>
                </div>
            </td>
        `;

        // CLICK EN LA FILA PRINCIPAL: ABRIR/CERRAR EL DETALLE (solo en mobile)
        tr.addEventListener('click', () => toggleDetalleMovimiento(p.id));

        tbodyMovimientos.appendChild(tr);
        tbodyMovimientos.appendChild(trDetalle);
    });
}

// ABRE O CIERRA EL DETALLE DE UN MOVIMIENTO
// muestra u oculta el detalle del movimiento seleccionado.
function toggleDetalleMovimiento(id) {
    if (window.innerWidth > 700) return;

    const filaPrincipal = tbodyMovimientos.querySelector(`.mov-fila[data-id="${id}"]`);
    const filaDetalle = tbodyMovimientos.querySelector(`.mov-detalle-fila[data-id="${id}"]`);

    if (!filaPrincipal || !filaDetalle) return;

    const estabaAbierta = filaDetalle.classList.contains('mov-detalle-visible');

    // CERRAR TODAS LAS FILAS ABIERTAS
    tbodyMovimientos.querySelectorAll('.mov-detalle-fila').forEach((fila) => {
        fila.classList.remove('mov-detalle-visible');
    });
    tbodyMovimientos.querySelectorAll('.mov-fila').forEach((fila) => {
        fila.classList.remove('mov-fila-abierta');
    });

    // SI LA CLICKEADA ESTABA CERRADA, ABRIRLA
    if (!estabaAbierta) {
        filaDetalle.classList.add('mov-detalle-visible');
        filaPrincipal.classList.add('mov-fila-abierta');
    }
}

// GRAFICOS

// elimina una instancia del gr?fico antes de volver a dibujarlo.
function destruirGrafico(instancia) {
    if (instancia) {
        instancia.destroy();
    }
}

const TOOLTIP_BASE = {
    backgroundColor: 'rgba(11, 74, 98, 0.95)',
    titleColor: '#ffffff',
    bodyColor: '#ffffff',
    padding: 12,
    cornerRadius: 8,
    titleFont: { size: 13, weight: 'bold' },
    bodyFont: { size: 12 },
};

// muestra el gr?fico de pedidos agrupados por estado.
function renderizarGraficoEstados(datos) {
    const canvas = document.getElementById('grafico-estados');
    const nota = document.getElementById('grafico-estados-nota');
    if (!canvas || !nota) return;

    const totales = {
        pendiente: 0,
        'en proceso': 0,
        completado: 0,
        cancelado: 0,
    };

    datos.forEach((d) => {
        const estado = (d.estado || 'pendiente').toLowerCase().trim();
        if (estado in totales) {
            totales[estado] += d.total;
        }
    });

    const totalGeneral = Object.values(totales).reduce((a, b) => a + b, 0);

    if (totalGeneral === 0) {
        destruirGrafico(graficoEstados);
        graficoEstados = null;
        nota.textContent = 'No hay pedidos para este período.';
        return;
    }

    const labels = Object.keys(totales).map((e) => capitalizar(e));
    const valores = Object.values(totales);
    const colores = Object.keys(totales).map((e) => COLORES_ESTADO[e] || COLORES.gris);

    destruirGrafico(graficoEstados);

    graficoEstados = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [
                {
                    data: valores,
                    backgroundColor: colores,
                    borderColor: '#ffffff',
                    borderWidth: 3,
                    hoverOffset: 8,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 10,
                        boxWidth: 10,
                        font: { size: 11, weight: '600' },
                        color: '#0b4a62',
                        usePointStyle: true,
                        pointStyle: 'circle',
                    },
                },
                tooltip: {
                    ...TOOLTIP_BASE,
                    callbacks: {
                        label: (ctx) => {
                            const valor = ctx.parsed;
                            const pct = ((valor / totalGeneral) * 100).toFixed(1);
                            return `${ctx.label}: ${valor} (${pct}%)`;
                        },
                    },
                },
            },
        },
    });

    nota.textContent = `Total: ${totalGeneral} pedido${totalGeneral !== 1 ? 's' : ''} entre reparaciones y compras.`;
}

// muestra el gr?fico de ventas agrupadas por per?odo.
function renderizarGraficoVentas(datos) {
    const canvas = document.getElementById('grafico-ventas');
    const nota = document.getElementById('grafico-ventas-nota');
    if (!canvas || !nota) return;

    if (!datos || datos.length === 0) {
        destruirGrafico(graficoVentas);
        graficoVentas = null;
        nota.textContent = 'No hay ventas registradas en este período.';
        return;
    }

    const labels = datos.map((d) => {
        const partes = d.fecha.split('-');
        if (partes.length === 3) {
            const [anio, mes, dia] = partes;
            return `${dia}/${mes}/${anio.slice(2)}`;
        }
        const [anio, mes] = partes;
        const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${MESES[parseInt(mes) - 1]} ${anio.slice(2)}`;
    });

    const totales = datos.map((d) => d.total);
    const cantidadPedidos = datos.map((d) => d.cantidad_pedidos);

    const totalGeneral = totales.reduce((a, b) => Number(a) + Number(b), 0);

    destruirGrafico(graficoVentas);

    graficoVentas = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Ventas ($)',
                    data: totales,
                    backgroundColor: COLORES.teal,
                    borderRadius: 8,
                    borderSkipped: false,
                    maxBarThickness: 38,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    ...TOOLTIP_BASE,
                    callbacks: {
                        label: (ctx) => {
                            const idx = ctx.dataIndex;
                            const total = ctx.parsed.y;
                            const cant = cantidadPedidos[idx];
                            return [
                                `Ventas: ${formatearPrecio(total)}`,
                                `Pedidos: ${cant}`,
                            ];
                        },
                    },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => `$${value}`,
                        color: '#777',
                        font: { size: 11 },
                    },
                    grid: { color: COLORES.grisClaro },
                },
                x: {
                    ticks: { color: '#777', font: { size: 11 } },
                    grid: { display: false },
                },
            },
        },
    });

    nota.textContent = `Total vendido en el período: ${formatearPrecio(totalGeneral)}.`;
}

// PLUGIN PERSONALIZADO: DIBUJA EL VALOR AL FINAL DE CADA BARRA
// se registra globalmente para no repetirlo en cada grafico
const pluginValoresEnBarras = {
    id: 'pluginValoresEnBarras',
    afterDatasetsDraw(chart) {
        const { ctx, data } = chart;

        // solo actua si el grafico tiene al menos una barra
        const meta = chart.getDatasetMeta(0);
        if (!meta || !meta.data) return;

        ctx.save();
        ctx.font = 'bold 12px Arial, sans-serif';
        ctx.fillStyle = '#0b4a62';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        meta.data.forEach((barra, index) => {
            const valor = data.datasets[0].data[index];
            if (valor === undefined || valor === null) return;

            // dibujar el valor un poco a la derecha de la barra
            ctx.fillText(String(valor), barra.x + 8, barra.y);
        });

        ctx.restore();
    },
};

// grafico 3: top 10 productos mas vendidos
// EN DESKTOP: GRAFICO DE BARRAS HORIZONTALES
// muestra el gr?fico de productos m?s vendidos.
function renderizarGraficoProductos(datos) {
    const canvas = document.getElementById('grafico-productos');
    const wrapperGrafico = document.getElementById('grafico-productos-wrapper');
    const wrapperTabla = document.getElementById('grafico-productos-tabla-wrapper');
    const tablaContenedor = document.getElementById('grafico-productos-tabla');
    const nota = document.getElementById('grafico-productos-nota');

    if (!canvas || !nota) return;

    // GUARDAR LOS DATOS PARA EL RESIZE
    ultimosProductosData = Array.isArray(datos) ? datos : [];

    // SIN DATOS: OCULTAR TODO Y MOSTRAR MENSAJE
    if (!datos || datos.length === 0) {
        nota.textContent = 'Aún no hay ventas registradas para calcular el ranking.';
        if (wrapperGrafico) wrapperGrafico.style.display = 'none';
        if (wrapperTabla) wrapperTabla.style.display = 'none';
        destruirGrafico(graficoProductos);
        graficoProductos = null;
        return;
    }

    const esMobile = window.innerWidth <= 700;

    // CALCULAR EL TOTAL VENDIDO (para la nota al pie)
    const totalVendido = datos.reduce(
        (total, producto) => total + Number(producto.total_vendido),
        0
    );

    if (esMobile) {
        // MODO MOBILE: TABLA
        if (wrapperGrafico) wrapperGrafico.style.display = 'none';
        if (wrapperTabla) wrapperTabla.style.display = 'block';

        // DESTRUIR EL GRAFICO SI EXISTIA (para evitar fugas de memoria)
        destruirGrafico(graficoProductos);
        graficoProductos = null;

        if (tablaContenedor) {
            tablaContenedor.innerHTML = construirTablaProductosHTML(datos);
        }
    } else {
        // MODO DESKTOP: GRAFICO DE BARRAS
        if (wrapperGrafico) wrapperGrafico.style.display = 'block';
        if (wrapperTabla) wrapperTabla.style.display = 'none';

        const labels = datos.map((d) => d.nombre_producto);
        const valores = datos.map((d) => Number(d.total_vendido));
        const colores = datos.map((_, i) => PALETA_PRODUCTOS[i % PALETA_PRODUCTOS.length]);

        const maxValor = Math.max(...valores, 1);
        const maxEjeX = Math.ceil(maxValor * 1.15 + 0.5);

        destruirGrafico(graficoProductos);

        graficoProductos = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Unidades vendidas',
                        data: valores,
                        backgroundColor: colores,
                        borderRadius: 6,
                        borderSkipped: false,
                        maxBarThickness: 22,
                    },
                ],
            },
            plugins: [pluginValoresEnBarras],
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        right: 30,
                    },
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        ...TOOLTIP_BASE,
                        position: 'nearest',
                        yAlign: 'center',
                        xAlign: 'left',
                        callbacks: {
                            label: (ctx) => {
                                const idx = ctx.dataIndex;
                                const cant = ctx.parsed.x;
                                const recaudado = datos[idx].total_recaudado;
                                return [
                                    `Vendidos: ${cant} unidad${cant !== 1 ? 'es' : ''}`,
                                    `Recaudado: ${formatearPrecio(recaudado)}`,
                                ];
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: maxEjeX,
                        ticks: {
                            stepSize: 1,
                            color: '#777',
                            font: { size: 11 },
                        },
                        grid: { color: COLORES.grisClaro },
                    },
                    y: {
                        ticks: {
                            color: '#0b4a62',
                            font: { size: 11, weight: '600' },
                        },
                        grid: { display: false },
                    },
                },
            },
        });
    }

    nota.textContent = `${datos.length} producto${datos.length !== 1 ? 's' : ''} con ventas · Total: ${totalVendido} unidad${totalVendido !== 1 ? 'es' : ''} vendida${totalVendido !== 1 ? 's' : ''}.`;
}

// genera el marcado de la tabla de productos m?s vendidos.
function construirTablaProductosHTML(datos) {
    const filas = datos
        .map((d, i) => {
            const color = PALETA_PRODUCTOS[i % PALETA_PRODUCTOS.length];
            return `
                <div class="grafico-tabla-fila">
                    <div class="grafico-tabla-cant" style="background-color: ${color}">
                        ${Number(d.total_vendido)}
                    </div>
                    <div class="grafico-tabla-nombre" title="${escapar(d.nombre_producto)}">
                        ${escapar(d.nombre_producto)}
                    </div>
                </div>
            `;
        })
        .join('');

    return `
        <div class="grafico-tabla-header">
            <span class="grafico-tabla-header-cant">Vendidos</span>
            <span class="grafico-tabla-header-nombre">Producto</span>
        </div>
        <div class="grafico-tabla-filas">
            ${filas}
        </div>
    `;
}

// CARGA DE DATOS

// solicita los datos y actualiza las secciones del panel.
async function cargarDashboard() {
    const icono = btnRefresh.querySelector('i');
    icono.classList.add('spinning');
    btnRefresh.disabled = true;

    const rangoActual = filtroTiempo ? filtroTiempo.value : 'todos';

    try {
        const [resPedidos, resProductos, resPortafolio, resEstadisticas] = await Promise.all([
            fetchAdmin(API_PEDIDOS),
            fetch(API_PRODUCTOS),
            fetch(API_PORTAFOLIO),
            fetchAdmin(`${API_ESTADISTICAS}?rango=${rangoActual}`),
        ]);

        if (!resPedidos.ok || !resProductos.ok || !resPortafolio.ok) {
            throw new Error('Error al obtener datos');
        }

        const [pedidos, productos, portafolio] = await Promise.all([
            resPedidos.json(),
            resProductos.json(),
            resPortafolio.json(),
        ]);

        const pedidosFiltrados = filtrarPorRangoTiempo(pedidos, rangoActual, 'creado_en');
        const reparaciones = pedidosFiltrados.filter((p) => esReparacion(p));
        const compras = pedidosFiltrados.filter((p) => !esReparacion(p));

        // RENDERIZAR TARJETAS
        renderizarStats(reparaciones, compras, productos, portafolio);
        renderizarUltimosMovimientos(pedidos);

        // RENDERIZAR GRAFICOS
        if (resEstadisticas.ok) {
            const stats = await resEstadisticas.json();

            if (stats.success) {
                renderizarGraficoEstados(stats.pedidos_por_estado || []);

                const h2Ventas = document.getElementById('grafico-ventas')?.closest('.grafico-card')?.querySelector('h2');
                if (h2Ventas) {
                    let textoRango = 'los últimos 6 meses';
                    if (rangoActual === 'hoy') textoRango = 'hoy';
                    if (rangoActual === 'semana') textoRango = 'la última semana';
                    if (rangoActual === 'mes') textoRango = 'el último mes';

                    h2Ventas.innerHTML = `<i class="fas fa-chart-line"></i> Ventas de ${textoRango}`;
                }

                renderizarGraficoVentas(stats.ventas_por_mes || []);
                renderizarGraficoProductos(stats.productos_mas_vendidos || []);
            }
        } else {
            console.warn('No se pudieron obtener las estadisticas del servidor.');
            const notaEstados = document.getElementById('grafico-estados-nota');
            const notaVentas = document.getElementById('grafico-ventas-nota');
            const notaProductos = document.getElementById('grafico-productos-nota');

            if (notaEstados) notaEstados.textContent = 'No se pudieron cargar los datos.';
            if (notaVentas) notaVentas.textContent = 'No se pudieron cargar los datos.';
            if (notaProductos) notaProductos.textContent = 'No se pudieron cargar los datos.';
        }
    } catch (error) {
        console.error('Error al cargar el dashboard:', error);
        mostrarToast('No se pudieron cargar las estadísticas.', true);

        document.querySelectorAll('.stat-numero').forEach((el) => {
            el.textContent = '—';
        });
        document.querySelectorAll('.stat-sub').forEach((el) => {
            el.textContent = '—';
        });

        tbodyMovimientos.innerHTML = '';
        estadoVacio.style.display = 'block';
        estadoVacio.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="color:#d9534f"></i>
            <p>No se pudieron cargar los datos</p>
            <small>Verificá que el servidor esté corriendo e intentá de nuevo.</small>
        `;
        contadorMovimientos.textContent = '0 movimientos';
    } finally {
        icono.classList.remove('spinning');
        btnRefresh.disabled = false;
    }
}

// EVENTOS

btnRefresh.addEventListener('click', cargarDashboard);
if (filtroTiempo) {
    filtroTiempo.addEventListener('change', cargarDashboard);
}

// re-renderizar el top de productos cuando cambia el ancho
//  (para alternar entre grafico y tabla)
let resizeTimerProductos = null;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimerProductos);
    resizeTimerProductos = setTimeout(() => {
        if (ultimosProductosData && ultimosProductosData.length > 0) {
            renderizarGraficoProductos(ultimosProductosData);
        }
    }, 200);
});

// INICIO

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(cargarDashboard, 100);
});