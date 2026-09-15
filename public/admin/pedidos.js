// LÓGICA DE LA PÁGINA "VER PEDIDOS" - DuotechBros Admin

const API_PEDIDOS = '/api/pedidos';

const tbody = document.getElementById('tbody-pedidos');
const contador = document.getElementById('contador-pedidos');
const estadoVacio = document.getElementById('estado-vacio');
const estadoCargando = document.getElementById('estado-cargando');
const btnRefresh = document.getElementById('btn-refresh');

// UTILIDADES

/* Formatea una fecha ISO a formato legible: "15/09/2026 14:30" */ 
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

/* Escapa texto para prevenir inyección HTML. */
function escapar(texto) {
    if (texto === null || texto === undefined) return '—';
    const div = document.createElement('div');
    div.textContent = String(texto);
    return div.innerHTML;
}

/* Devuelve la clase CSS según el estado del pedido. */
function claseEstado(estado) {
    const e = (estado || 'pendiente').toLowerCase().replace(/\s+/g, '-');
    const clasesValidas = ['pendiente', 'en-proceso', 'completado', 'cancelado'];
    return clasesValidas.includes(e) ? `badge-${e}` : 'badge-pendiente';
}

// RENDERIZADO

/* Renderiza la lista de pedidos en la tabla. */
function renderizarPedidos(pedidos) {
    tbody.innerHTML = '';

    if (!pedidos || pedidos.length === 0) {
        estadoVacio.style.display = 'block';
        contador.textContent = '0 pedidos';
        return;
    }

    estadoVacio.style.display = 'none';
    contador.textContent = `${pedidos.length} pedido${pedidos.length !== 1 ? 's' : ''}`;

    pedidos.forEach((p) => {
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
                <span class="badge ${claseEstado(p.estado)}">${escapar(p.estado || 'pendiente')}</span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// CARGA DE DATOS

/* Carga los pedidos desde la API y los renderiza. */
async function cargarPedidos() {
    // Mostrar estado de carga
    estadoCargando.style.display = 'block';
    estadoVacio.style.display = 'none';
    tbody.innerHTML = '';

    // Animar el icono del botón de refrescar
    const icono = btnRefresh.querySelector('i');
    icono.classList.add('spinning');
    btnRefresh.disabled = true;

    try {
        const respuesta = await fetch(API_PEDIDOS);
        if (!respuesta.ok) {
            throw new Error(`Error HTTP ${respuesta.status}`);
        }
        const pedidos = await respuesta.json();
        renderizarPedidos(pedidos);
    } catch (error) {
        console.error('Error al cargar pedidos:', error);
        tbody.innerHTML = '';
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

// EVENTOS

btnRefresh.addEventListener('click', cargarPedidos);

// Cargar pedidos al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    // Pequeña espera para que protegerPagina() (en admin.js) corra primero
    setTimeout(cargarPedidos, 100);
});