// LOGICA DEL DASHBOARD - DUOTECHBROS ADMIN
// calcula estadisticas y renderiza los graficos con chart.js

const API_PEDIDOS = '/api/pedidos';
const API_PRODUCTOS = '/api/productos';
const API_PORTAFOLIO = '/api/portafolio';
const API_ESTADISTICAS = '/api/admin/estadisticas';

const btnRefresh = document.getElementById('btn-refresh');
const tbodyMovimientos = document.getElementById('tbody-movimientos');
const estadoVacio = document.getElementById('estado-vacio');
const contadorMovimientos = document.getElementById('contador-movimientos');

// colores reutilizables para los graficos
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

// colores por estado (coherentes con los badges)
const COLORES_ESTADO = {
    pendiente: '#f59e0b',
    'en proceso': '#007bff',
    completado: '#22c55e',
    cancelado: '#dc3545',
};

// paleta para los productos mas vendidos (se cicla)
const PALETA_PRODUCTOS = [
    '#007bff', '#0a9396', '#f59e0b', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#6366f1',
    '#22c55e', '#dc3545',
];

// guardamos las instancias de los graficos para poder destruirlos al refrescar
let graficoEstados = null;
let graficoVentas = null;
let graficoProductos = null;

// UTILIDADES

function escapar(texto) {
    if (texto === null || texto === undefined) return '—';
    const div = document.createElement('div');
    div.textContent = String(texto);
    return div.innerHTML;
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

function formatearPrecio(precio) {
    const num = Number(precio);
    if (isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
}

function capitalizar(texto) {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function normalizarEstado(estado) {
    return (estado || 'pendiente').toLowerCase().trim();
}

function claseBadgeEstado(estado) {
    const e = normalizarEstado(estado).replace(/\s+/g, '-');
    const validos = ['pendiente', 'en-proceso', 'completado', 'cancelado'];
    return validos.includes(e) ? `badge-${e}` : 'badge-pendiente';
}

function esReparacion(pedido) {
    return (pedido.tipo || 'reparacion') === 'reparacion';
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

// RENDERIZADO DE ESTADISTICAS PRINCIPALES

function renderizarStats(reparaciones, compras, productos, portafolio) {
    document.getElementById('total-reparaciones').textContent = reparaciones.length;
    document.getElementById('total-compras').textContent = compras.length;
    document.getElementById('total-productos').textContent = productos.length;
    document.getElementById('total-portafolio').textContent = portafolio.length;

    // subtitulo de reparaciones
    const pendientesRep = reparaciones.filter(
        (p) => normalizarEstado(p.estado) === 'pendiente'
    ).length;
    const subReparaciones = document.getElementById('sub-reparaciones');
    if (pendientesRep > 0) {
        subReparaciones.innerHTML = `<span class="sub-destacado">${pendientesRep}</span> pendiente${pendientesRep !== 1 ? 's' : ''}`;
    } else {
        subReparaciones.textContent = 'Sin pendientes';
    }

    // subtitulo de compras
    const pendientesComp = compras.filter(
        (p) => normalizarEstado(p.estado) === 'pendiente'
    ).length;
    const subCompras = document.getElementById('sub-compras');
    if (pendientesComp > 0) {
        subCompras.innerHTML = `<span class="sub-destacado">${pendientesComp}</span> pendiente${pendientesComp !== 1 ? 's' : ''}`;
    } else {
        subCompras.textContent = 'Sin pendientes';
    }

    // subtitulo de productos
    const stockBajo = productos.filter((p) => Number(p.stock) <= 3).length;
    const subProductos = document.getElementById('sub-productos');
    if (stockBajo > 0) {
        subProductos.innerHTML = `<span class="sub-alerta">${stockBajo}</span> con stock bajo`;
    } else {
        subProductos.textContent = 'Stock saludable';
    }

    // subtitulo de portafolio
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

        const tipoBadge = esRep
            ? `<span class="mov-tipo-badge mov-tipo-reparacion"><i class="fas fa-tools"></i> Reparacion</span>`
            : `<span class="mov-tipo-badge mov-tipo-compra"><i class="fas fa-shopping-bag"></i> Compra</span>`;

        const detalle = esRep
            ? escapar(p.modelo_celular || 'Sin modelo')
            : escapar(p.modelo_celular || 'Compra de accesorios');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${tipoBadge}</td>
            <td><span class="cell-nombre">${pedidoIdFormateado}</span></td>
            <td>${escapar(p.nombre_cliente)}</td>
            <td>
                <div class="cell-descripcion" title="${detalle}">
                    ${detalle}
                </div>
            </td>
            <td><span class="cell-fecha">${formatearFecha(p.creado_en)}</span></td>
            <td>
                <span class="badge ${claseBadgeEstado(estadoActual)}">
                    ${capitalizar(estadoActual)}
                </span>
            </td>
        `;
        tbodyMovimientos.appendChild(tr);
    });
}

// GRAFICOS

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

// grafico 1: pedidos por estado (doughnut)
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
        nota.textContent = 'No hay pedidos registrados todavía.';
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

// grafico 2: ventas de los ultimos 6 meses
function renderizarGraficoVentas(datos) {
    const canvas = document.getElementById('grafico-ventas');
    const nota = document.getElementById('grafico-ventas-nota');
    if (!canvas || !nota) return;

    if (!datos || datos.length === 0) {
        nota.textContent = 'No hay datos de ventas.';
        return;
    }

    const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const labels = datos.map((d) => {
        const [anio, mes] = d.mes.split('-');
        return `${MESES_CORTOS[parseInt(mes) - 1]} ${anio}`;
    });

    const totales = datos.map((d) => d.total);
    const cantidadPedidos = datos.map((d) => d.cantidad_pedidos);

    const totalGeneral = totales.reduce((a, b) => a + b, 0);

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

    nota.textContent = `Total vendido en 6 meses: ${formatearPrecio(totalGeneral)}.`;
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
function renderizarGraficoProductos(datos) {
    const canvas = document.getElementById('grafico-productos');
    const nota = document.getElementById('grafico-productos-nota');
    if (!canvas || !nota) return;

    if (!datos || datos.length === 0) {
        nota.textContent = 'Aún no hay ventas registradas para calcular el ranking.';
        return;
    }

    const labels = datos.map((d) => d.nombre_producto);
    const valores = datos.map((d) => d.total_vendido);
    const colores = datos.map((_, i) => PALETA_PRODUCTOS[i % PALETA_PRODUCTOS.length]);

    const totalVendido = valores.reduce((a, b) => a + b, 0);
    const maxValor = Math.max(...valores, 1);

    // ajuste 1: dar margen al eje X para que las barras no toquen el borde
    // sumamos un poco mas del maximo para que el plugin de valores tenga lugar
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
        // registro del plugin que dibuja los valores al final de las barras
        plugins: [pluginValoresEnBarras],
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                // ajuste 2: agregar padding a la derecha para que los valores
                // dibujados no se corten con el borde de la card
                padding: {
                    right: 30,
                },
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    ...TOOLTIP_BASE,
                    // ajuste 3: posicionar el tooltip cerca del cursor
                    // y evitar que se salga de la pantalla
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
                    // ajuste 1: usar el maximo calculado con margen
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

    nota.textContent = `${datos.length} producto${datos.length !== 1 ? 's' : ''} con ventas · Total: ${totalVendido} unidad${totalVendido !== 1 ? 'es' : ''} vendida${totalVendido !== 1 ? 's' : ''}.`;
}

// CARGA DE DATOS

async function cargarDashboard() {
    const icono = btnRefresh.querySelector('i');
    icono.classList.add('spinning');
    btnRefresh.disabled = true;

    try {
        const [resPedidos, resProductos, resPortafolio, resEstadisticas] = await Promise.all([
            fetch(API_PEDIDOS),
            fetch(API_PRODUCTOS),
            fetch(API_PORTAFOLIO),
            fetchAdmin(API_ESTADISTICAS),
        ]);

        if (!resPedidos.ok || !resProductos.ok || !resPortafolio.ok) {
            throw new Error('Error al obtener datos');
        }

        const [pedidos, productos, portafolio] = await Promise.all([
            resPedidos.json(),
            resProductos.json(),
            resPortafolio.json(),
        ]);

        const reparaciones = pedidos.filter((p) => esReparacion(p));
        const compras = pedidos.filter((p) => !esReparacion(p));

        // renderizar tarjetas y tabla
        renderizarStats(reparaciones, compras, productos, portafolio);
        renderizarUltimosMovimientos(pedidos);

        // renderizar graficos
        if (resEstadisticas.ok) {
            const stats = await resEstadisticas.json();

            if (stats.success) {
                renderizarGraficoEstados(stats.pedidos_por_estado || []);
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

// INICIO

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(cargarDashboard, 100);
});