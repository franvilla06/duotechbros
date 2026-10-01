// LOGICA DEL DASHBOARD - DUOTECHBROS ADMIN
// calcula estadisticas reales a partir de las 3 apis publicas

const API_PEDIDOS = '/api/pedidos';
const API_PRODUCTOS = '/api/productos';
const API_PORTAFOLIO = '/api/portafolio';

const btnRefresh = document.getElementById('btn-refresh');
const tbodyMovimientos = document.getElementById('tbody-movimientos');
const estadoVacio = document.getElementById('estado-vacio');
const contadorMovimientos = document.getElementById('contador-movimientos');

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

// contar pedidos por estado dentro de una lista
function contarPorEstado(pedidos) {
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
            conteo.pendiente++;
        }
    });

    return conteo;
}

// RENDERIZADO DE ESTADISTICAS PRINCIPALES

function renderizarStats(reparaciones, compras, productos, portafolio) {
    // totales
    document.getElementById('total-reparaciones').textContent = reparaciones.length;
    document.getElementById('total-compras').textContent = compras.length;
    document.getElementById('total-productos').textContent = productos.length;
    document.getElementById('total-portafolio').textContent = portafolio.length;

    // subtitulos con informacion adicional

    // reparaciones pendientes
    const pendientesRep = reparaciones.filter(
        (p) => normalizarEstado(p.estado) === 'pendiente'
    ).length;
    const subReparaciones = document.getElementById('sub-reparaciones');
    if (pendientesRep > 0) {
        subReparaciones.innerHTML = `<span class="sub-destacado">${pendientesRep}</span> pendiente${pendientesRep !== 1 ? 's' : ''}`;
    } else {
        subReparaciones.textContent = 'Sin pendientes';
    }

    // compras pendientes
    const pendientesComp = compras.filter(
        (p) => normalizarEstado(p.estado) === 'pendiente'
    ).length;
    const subCompras = document.getElementById('sub-compras');
    if (pendientesComp > 0) {
        subCompras.innerHTML = `<span class="sub-destacado">${pendientesComp}</span> pendiente${pendientesComp !== 1 ? 's' : ''}`;
    } else {
        subCompras.textContent = 'Sin pendientes';
    }

    // productos con stock bajo
    const stockBajo = productos.filter((p) => Number(p.stock) <= 3).length;
    const subProductos = document.getElementById('sub-productos');
    if (stockBajo > 0) {
        subProductos.innerHTML = `<span class="sub-alerta">${stockBajo}</span> con stock bajo`;
    } else {
        subProductos.textContent = 'Stock saludable';
    }

    // portafolio: mostrar la fecha del mas reciente
    const subPortafolio = document.getElementById('sub-portafolio');
    if (portafolio.length > 0) {
        // ordenar por fecha desc
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

// RENDERIZADO DE ESTADOS POR TIPO

function renderizarEstadosReparaciones(reparaciones) {
    const conteo = contarPorEstado(reparaciones);

    document.getElementById('rep-pendiente').textContent = conteo.pendiente;
    document.getElementById('rep-en-proceso').textContent = conteo['en proceso'];
    document.getElementById('rep-completado').textContent = conteo.completado;
    document.getElementById('rep-cancelado').textContent = conteo.cancelado;
}

function renderizarEstadosCompras(compras) {
    const conteo = contarPorEstado(compras);

    document.getElementById('comp-pendiente').textContent = conteo.pendiente;
    document.getElementById('comp-en-proceso').textContent = conteo['en proceso'];
    document.getElementById('comp-completado').textContent = conteo.completado;
    document.getElementById('comp-cancelado').textContent = conteo.cancelado;
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

    // tomar los ultimos 8 (ya vienen ordenados por fecha desc)
    const ultimos = pedidos.slice(0, 8);

    contadorMovimientos.textContent = `${ultimos.length} de ${pedidos.length}`;

    ultimos.forEach((p) => {
        const estadoActual = p.estado || 'pendiente';
        const pedidoIdFormateado = `#${String(p.id).padStart(4, '0')}`;
        const esRep = esReparacion(p);

        // badge de tipo
        const tipoBadge = esRep
            ? `<span class="mov-tipo-badge mov-tipo-reparacion"><i class="fas fa-tools"></i> Reparacion</span>`
            : `<span class="mov-tipo-badge mov-tipo-compra"><i class="fas fa-shopping-bag"></i> Compra</span>`;

        // detalle segun tipo
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

// CARGA DE DATOS

async function cargarDashboard() {
    const icono = btnRefresh.querySelector('i');
    icono.classList.add('spinning');
    btnRefresh.disabled = true;

    try {
        // 3 peticiones en paralelo
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

        // separar pedidos por tipo
        const reparaciones = pedidos.filter((p) => esReparacion(p));
        const compras = pedidos.filter((p) => !esReparacion(p));

        // renderizar todo
        renderizarStats(reparaciones, compras, productos, portafolio);
        renderizarEstadosReparaciones(reparaciones);
        renderizarEstadosCompras(compras);
        renderizarUltimosMovimientos(pedidos);
    } catch (error) {
        console.error('Error al cargar el dashboard:', error);
        mostrarToast('No se pudieron cargar las estadísticas.', true);

        // limpiar numeros
        document.querySelectorAll('.stat-numero, .estado-numero').forEach((el) => {
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