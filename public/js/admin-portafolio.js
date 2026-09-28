// ============================================================
// LÓGICA DE LA PÁGINA "GESTIONAR PORTAFOLIO" - DuotechBros Admin
// Incluye: crear, editar, eliminar, buscar, filtrar y ordenar
// ============================================================

const API_PORTAFOLIO = '/api/portafolio';
const API_ADMIN_PORTAFOLIO = '/api/admin/portafolio';

const formTrabajo = document.getElementById('form-trabajo');
const tbody = document.getElementById('tbody-trabajos');
const contador = document.getElementById('contador-trabajos');
const estadoVacio = document.getElementById('estado-vacio');
const estadoSinResultados = document.getElementById('estado-sin-resultados');
const estadoCargando = document.getElementById('estado-cargando');
const btnGuardar = document.getElementById('btn-guardar');

const buscador = document.getElementById('buscador-trabajos');
const filtrosTipo = document.getElementById('filtros-tipo');
const btnLimpiar = document.getElementById('btn-limpiar');

const modalEditar = document.getElementById('modal-editar');
const modalClose = document.getElementById('modal-close');
const formEditar = document.getElementById('form-editar');
const btnCancelar = document.getElementById('btn-cancelar');
const btnActualizar = document.getElementById('btn-actualizar');

// Estado local
let trabajosOriginales = [];
let tipoFiltroActivo = 'Todos';
let textoBusqueda = '';

// Ordenamiento
let ordenActual = { campo: null, tipo: null, direccion: 'asc' };

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

function claseTipo(tipo) {
    if (!tipo) return 'badge-tipo-default';
    const t = tipo.toLowerCase();
    if (t.includes('pantalla') || t.includes('display')) return 'badge-tipo-pantalla';
    if (t.includes('bater')) return 'badge-tipo-bateria';
    if (t.includes('placa')) return 'badge-tipo-placa';
    if (t.includes('software') || t.includes('dato')) return 'badge-tipo-software';
    return 'badge-tipo-default';
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

// ----- ORDENAMIENTO -----

function aplicarOrdenamiento(array) {
    if (!ordenActual.campo) return array;

    return [...array].sort((a, b) => {
        const cmp = compararValores(a[ordenActual.campo], b[ordenActual.campo], ordenActual.tipo);
        return ordenActual.direccion === 'asc' ? cmp : -cmp;
    });
}

// ----- FILTROS -----

function construirFiltrosTipo() {
    const tipos = ['Todos'];
    trabajosOriginales.forEach((t) => {
        if (t.tipo_reparacion && !tipos.includes(t.tipo_reparacion)) {
            tipos.push(t.tipo_reparacion);
        }
    });

    filtrosTipo.innerHTML = '';

    tipos.forEach((tipo) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'filtro-chip' + (tipo === tipoFiltroActivo ? ' active' : '');
        chip.dataset.tipo = tipo;
        chip.textContent = tipo;

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

function actualizarBotonLimpiar() {
    const hayFiltro = tipoFiltroActivo !== 'Todos' || textoBusqueda.trim() !== '';
    btnLimpiar.disabled = !hayFiltro;
}

// ----- RENDERIZADO -----

function renderizarTrabajos(trabajos) {
    tbody.innerHTML = '';

    if (trabajos.length === 0) {
        if (trabajosOriginales.length === 0) {
            estadoVacio.style.display = 'block';
        } else {
            estadoSinResultados.style.display = 'block';
        }
        contador.textContent = '0 trabajos';
        return;
    }

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
                <button class="btn-editar" title="Editar" data-id="${t.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-eliminar" title="Eliminar" data-id="${t.id}" data-titulo="${escapar(t.titulo)}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-editar').forEach((btn) => {
        btn.addEventListener('click', () => abrirModalEdicion(btn.dataset.id));
    });

    tbody.querySelectorAll('.btn-eliminar').forEach((btn) => {
        btn.addEventListener('click', () => {
            eliminarTrabajo(btn.dataset.id, btn.dataset.titulo);
        });
    });
}

// ----- APLICAR FILTROS + ORDEN -----

function aplicarFiltros() {
    estadoVacio.style.display = 'none';
    estadoSinResultados.style.display = 'none';

    let filtrados = [...trabajosOriginales];

    if (tipoFiltroActivo !== 'Todos') {
        filtrados = filtrados.filter((t) => t.tipo_reparacion === tipoFiltroActivo);
    }

    if (textoBusqueda.trim() !== '') {
        const q = textoBusqueda.trim().toLowerCase();
        filtrados = filtrados.filter(
            (t) =>
                (t.titulo && t.titulo.toLowerCase().includes(q)) ||
                (t.descripcion && t.descripcion.toLowerCase().includes(q)) ||
                (t.tipo_reparacion && t.tipo_reparacion.toLowerCase().includes(q))
        );
    }

    filtrados = aplicarOrdenamiento(filtrados);

    actualizarBotonLimpiar();
    renderizarTrabajos(filtrados);
}

// ----- CARGA DE DATOS -----

async function cargarTrabajos() {
    estadoCargando.style.display = 'block';
    estadoVacio.style.display = 'none';
    estadoSinResultados.style.display = 'none';
    tbody.innerHTML = '';

    try {
        const respuesta = await fetch(API_PORTAFOLIO);
        if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
        const trabajos = await respuesta.json();

        trabajosOriginales = trabajos;

        construirFiltrosTipo();

        if (trabajos.length === 0) {
            estadoVacio.style.display = 'block';
            contador.textContent = '0 trabajos';
        } else {
            aplicarFiltros();
        }
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

// ----- CREAR TRABAJO -----

formTrabajo.addEventListener('submit', async (e) => {
    e.preventDefault();

    const datos = {
        titulo: document.getElementById('titulo').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim() || null,
        tipo_reparacion: document.getElementById('tipo_reparacion').value || null,
        imagen_url: document.getElementById('imagen_url').value.trim() || null,
    };

    if (!datos.titulo) {
        mostrarToast('El título del trabajo es obligatorio.', true);
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
            mostrarToast('✅ Trabajo publicado correctamente.');
            formTrabajo.reset();
            cargarTrabajos();
        } else {
            mostrarToast(`❌ Error: ${resultado.error || 'No se pudo guardar.'}`, true);
        }
    } catch (error) {
        console.error('Error al crear trabajo:', error);
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar Trabajo';
    }
});

// ----- MODAL -----

function abrirModalEdicion(id) {
    const trabajo = trabajosOriginales.find((t) => String(t.id) === String(id));
    if (!trabajo) {
        mostrarToast('No se encontró el trabajo.', true);
        return;
    }

    document.getElementById('edit-id').value = trabajo.id;
    document.getElementById('edit-titulo').value = trabajo.titulo || '';
    document.getElementById('edit-descripcion').value = trabajo.descripcion || '';
    document.getElementById('edit-tipo_reparacion').value = trabajo.tipo_reparacion || '';
    document.getElementById('edit-imagen_url').value = trabajo.imagen_url || '';

    modalEditar.classList.add('modal-visible');
}

function cerrarModalEdicion() {
    modalEditar.classList.remove('modal-visible');
    formEditar.reset();
}

modalClose.addEventListener('click', cerrarModalEdicion);
btnCancelar.addEventListener('click', cerrarModalEdicion);

modalEditar.addEventListener('click', (e) => {
    if (e.target === modalEditar) cerrarModalEdicion();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalEditar.classList.contains('modal-visible')) {
        cerrarModalEdicion();
    }
});

// ----- GUARDAR CAMBIOS -----

formEditar.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('edit-id').value;

    const datos = {
        titulo: document.getElementById('edit-titulo').value.trim(),
        descripcion: document.getElementById('edit-descripcion').value.trim() || null,
        tipo_reparacion: document.getElementById('edit-tipo_reparacion').value || null,
        imagen_url: document.getElementById('edit-imagen_url').value.trim() || null,
    };

    if (!datos.titulo) {
        mostrarToast('El título del trabajo es obligatorio.', true);
        return;
    }

    btnActualizar.disabled = true;
    btnActualizar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    try {
        const respuesta = await fetchAdmin(`${API_ADMIN_PORTAFOLIO}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(datos),
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            mostrarToast('✅ Trabajo actualizado correctamente.');
            cerrarModalEdicion();
            cargarTrabajos();
        } else {
            mostrarToast(`❌ Error: ${resultado.error || 'No se pudo actualizar.'}`, true);
        }
    } catch (error) {
        console.error('Error al actualizar trabajo:', error);
    } finally {
        btnActualizar.disabled = false;
        btnActualizar.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
    }
});

// ----- ELIMINAR -----

async function eliminarTrabajo(id, titulo) {
    const confirmar = confirm(`¿Estás seguro de que querés eliminar "${titulo}"?`);
    if (!confirmar) return;

    try {
        const respuesta = await fetchAdmin(`${API_ADMIN_PORTAFOLIO}/${id}`, {
            method: 'DELETE',
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            mostrarToast('✅ Trabajo eliminado.');
            cargarTrabajos();
        } else {
            mostrarToast(`❌ Error: ${resultado.error || 'No se pudo eliminar.'}`, true);
        }
    } catch (error) {
        console.error('Error al eliminar trabajo:', error);
    }
}

// ----- EVENTOS -----

buscador.addEventListener('input', (e) => {
    textoBusqueda = e.target.value;
    aplicarFiltros();
});

btnLimpiar.addEventListener('click', () => {
    textoBusqueda = '';
    buscador.value = '';
    tipoFiltroActivo = 'Todos';
    filtrosTipo.querySelectorAll('.filtro-chip').forEach((c) => {
        c.classList.toggle('active', c.dataset.tipo === 'Todos');
    });
    aplicarFiltros();
});

// ----- INICIO -----

document.addEventListener('DOMContentLoaded', () => {
    configurarColumnasOrdenables(
        'tabla-trabajos',
        {
            1: { campo: 'titulo', tipo: 'string' },
            2: { campo: 'descripcion', tipo: 'string' },
            3: { campo: 'tipo_reparacion', tipo: 'string' },
            4: { campo: 'fecha', tipo: 'fecha' },
            // 0 = Imagen, 5 = Acciones → no ordenables
        },
        () => ordenActual,
        (nuevo) => { ordenActual = nuevo; },
        aplicarFiltros
    );

    setTimeout(cargarTrabajos, 100);
});