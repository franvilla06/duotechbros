// ============================================================
// LÓGICA DEL DASHBOARD - DuotechBros Admin
// Calcula estadísticas reales a partir de las 3 APIs públicas
// ============================================================

const API_PEDIDOS = '/api/pedidos';
const API_PRODUCTOS = '/api/productos';
const API_PORTAFOLIO = '/api/portafolio';

const btnRefresh = document.getElementById('btn-refresh');
const tbodyUltimos = document.getElementById('tbody-ultimos');
const estadoVacio = document.getElementById('estado-vacio');

// ----- UTILIDADES -----

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
    return `${dia}/${mes}/${anio}`;
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

// ----- RENDERIZADO -----

function renderizarEstadisticas(pedidos, productos, portafolio) {
    // Totales principales
    document.getElementById('total-pedidos').textContent = pedidos.length;
    document.getElementById('total-productos').textContent = productos.length;
    document.getElementById('total-portafolio').textContent = portafolio.length;

    // Productos con stock bajo (<= 3 unidades)
    const stockBajo = productos.filter((p) => Number(p.stock) <= 3).length;
    document.getElementById('total-stock-bajo').textContent = stockBajo;

    // Conteo por estado de pedidos
    const conteo = {
        pendiente: 0,
        'en proceso': 0,
        completado: 0,
        cancelado: 0,
    };

    pedidos.forEach((p) => {
        const estado = normalizarEstado(p.estado);
        if (estado in conteo) {
            conteo[estado]++;
        } else {
            conteo.pendiente++; // Los desconocidos se cuentan como pendientes
        }
    });

    document.getElementById('pedidos-pendiente').textContent = conteo.pendiente;
    document.getElementById('pedidos-en-proceso').textContent = conteo['en proceso'];
    document.getElementById('pedidos-completado').textContent = conteo.completado;
    document.getElementById('pedidos-cancelado').textContent = conteo.cancelado;
}

function renderizarUltimosPedidos(pedidos) {
    tbodyUltimos.innerHTML = '';

    if (pedidos.length === 0) {
        estadoVacio.style.display = 'block';
        return;
    }

    estadoVacio.style.display = 'none';

    // Tomar los 5 más recientes (ya vienen ordenados por fecha desc desde la API)
    const ultimos = pedidos.slice(0, 5);

    ultimos.forEach((p) => {
        const estadoActual = p.estado || 'pendiente';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="cell-nombre">${escapar(p.nombre_cliente)}</span></td>
            <td>${escapar(p.modelo_celular)}</td>
            <td><span class="cell-fecha">${formatearFecha(p.creado_en)}</span></td>
            <td>
                <span class="badge ${claseBadgeEstado(estadoActual)}">
                    ${capitalizar(estadoActual)}
                </span>
            </td>
        `;
        tbodyUltimos.appendChild(tr);
    });
}

// ----- CARGA DE DATOS -----

async function cargarDashboard() {
    const icono = btnRefresh.querySelector('i');
    icono.classList.add('spinning');
    btnRefresh.disabled = true;

    try {
        // Hacemos las 3 peticiones en paralelo
        const [resPedidos, resProductos, resPortafolio] = await Promise.all([
            fetch(API_PEDIDOS),
            fetch(API_PRODUCTOS),
            fetch(API_PORTAFOLIO),
        ]);

        if (!resPedidos.ok || !resProductos.ok || !resPortafolio.ok) {
            throw new Error('Error al obtener datos');
        }

        const [pedidos, productos, portafolio] = await Promise.all([
            resPedidos.json(),
            resProductos.json(),
            resPortafolio.json(),
        ]);

        renderizarEstadisticas(pedidos, productos, portafolio);
        renderizarUltimosPedidos(pedidos);
    } catch (error) {
        console.error('Error al cargar el dashboard:', error);
        mostrarToast('❌ No se pudieron cargar las estadísticas.', true);

        // Poner guiones en los números si falla
        document.querySelectorAll('.stat-numero, .estado-numero').forEach((el) => {
            el.textContent = '—';
        });

        tbodyUltimos.innerHTML = '';
        estadoVacio.style.display = 'block';
        estadoVacio.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="color:#d9534f"></i>
            <p>No se pudieron cargar los datos</p>
            <small>Verificá que el servidor esté corriendo e intentá de nuevo.</small>
        `;
    } finally {
        icono.classList.remove('spinning');
        btnRefresh.disabled = false;
    }
}

// ----- EVENTOS -----

btnRefresh.addEventListener('click', cargarDashboard);

// ----- INICIO -----

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(cargarDashboard, 100);
});