// LÓGICA DE LA PÁGINA "GESTIONAR PORTAFOLIO" - DuotechBros Admin

const API_PORTAFOLIO = '/api/portafolio';
const API_ADMIN_PORTAFOLIO = '/api/admin/portafolio';

const formTrabajo = document.getElementById('form-trabajo');
const tbody = document.getElementById('tbody-trabajos');
const contador = document.getElementById('contador-trabajos');
const estadoVacio = document.getElementById('estado-vacio');
const estadoCargando = document.getElementById('estado-cargando');
const btnGuardar = document.getElementById('btn-guardar');

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
    return `${dia}/${mes}/${anio}`;
}

function claseTipo(tipo) {
    if (!tipo) return 'badge-tipo-default';
    const t = tipo.toLowerCase();
    if (t.includes('pantalla') || t.includes('display')) return 'badge-tipo-pantalla';
    if (t.includes('bater')) return 'badge-tipo-bateria';
    if (t.includes('placa')) return 'badge-tipo-placa';
    if (t.includes('software') || t.includes('dato')) return 'badge-tipo-software';
    return 'badge-tipo-default';
}

// RENDERIZADO

function renderizarTrabajos(trabajos) {
    tbody.innerHTML = '';

    if (!trabajos || trabajos.length === 0) {
        estadoVacio.style.display = 'block';
        contador.textContent = '0 trabajos';
        return;
    }

    estadoVacio.style.display = 'none';
    contador.textContent = `${trabajos.length} trabajo${trabajos.length !== 1 ? 's' : ''}`;

    trabajos.forEach((t) => {
        const tr = document.createElement('tr');

        const imagenHTML = t.imagen_url
            ? `<img src="${escapar(t.imagen_url)}" alt="${escapar(t.titulo)}" class="cell-imagen-portafolio" onerror="this.outerHTML='<div class=\\'cell-imagen-portafolio-placeholder\\'><i class=\\'fas fa-image\\'></i></div>'" />`
            : `<div class="cell-imagen-portafolio-placeholder"><i class="fas fa-image"></i></div>`;

        tr.innerHTML = `
            <td>${imagenHTML}</td>
            <td><span class="cell-nombre">${escapar(t.titulo)}</span></td>
            <td>
                <div class="cell-descripcion" title="${escapar(t.descripcion)}">
                    ${escapar(t.descripcion)}
                </div>
            </td>
            <td>
                <span class="badge ${claseTipo(t.tipo_reparacion)}">
                    ${escapar(t.tipo_reparacion || 'Sin categoría')}
                </span>
            </td>
            <td><span class="cell-fecha">${formatearFecha(t.fecha)}</span></td>
            <td style="text-align: right">
                <button class="btn-eliminar" title="Eliminar" data-id="${t.id}" data-titulo="${escapar(t.titulo)}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Asignar evento a cada botón de eliminar
    tbody.querySelectorAll('.btn-eliminar').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const titulo = btn.dataset.titulo;
            eliminarTrabajo(id, titulo);
        });
    });
}

// CARGA DE DATOS

async function cargarTrabajos() {
    estadoCargando.style.display = 'block';
    estadoVacio.style.display = 'none';
    tbody.innerHTML = '';

    try {
        const respuesta = await fetch(API_PORTAFOLIO);
        if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
        const trabajos = await respuesta.json();
        renderizarTrabajos(trabajos);
    } catch (error) {
        console.error('Error al cargar trabajos:', error);
        tbody.innerHTML = '';
        estadoVacio.style.display = 'block';
        estadoVacio.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="color:#d9534f"></i>
            <p>No se pudieron cargar los trabajos</p>
            <small>Verificá que el servidor esté corriendo e intentá de nuevo.</small>
        `;
    } finally {
        estadoCargando.style.display = 'none';
    }
}

// CREAR TRABAJO

formTrabajo.addEventListener('submit', async (e) => {
    e.preventDefault();

    const datos = {
        titulo: document.getElementById('titulo').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim() || null,
        tipo_reparacion: document.getElementById('tipo_reparacion').value || null,
        imagen_url: document.getElementById('imagen_url').value.trim() || null,
    };

    if (!datos.titulo) {
        alert('El título del trabajo es obligatorio.');
        return;
    }

    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    try {
        const respuesta = await fetchAdmin(API_ADMIN_PORTAFOLIO, {
            method: 'POST',
            body: JSON.stringify(datos),
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            alert('Trabajo publicado correctamente.');
            formTrabajo.reset();
            cargarTrabajos();
        } else {
            alert(`Error: ${resultado.error || 'No se pudo guardar el trabajo.'}`);
        }
    } catch (error) {
        console.error('Error al crear trabajo:', error);
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar Trabajo';
    }
});

// ELIMINAR TRABAJO

async function eliminarTrabajo(id, titulo) {
    const confirmar = confirm(`¿Estás seguro de que querés eliminar "${titulo}"?`);
    if (!confirmar) return;

    try {
        const respuesta = await fetchAdmin(`${API_ADMIN_PORTAFOLIO}/${id}`, {
            method: 'DELETE',
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            alert('Trabajo eliminado.');
            cargarTrabajos();
        } else {
            alert(`Error: ${resultado.error || 'No se pudo eliminar el trabajo.'}`);
        }
    } catch (error) {
        console.error('Error al eliminar trabajo:', error);
    }
}

//  INICIO 

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(cargarTrabajos, 100);
});