// LOGICA DE LA PAGINA "GESTIONAR PORTAFOLIO" - DUOTECHBROS ADMIN

const API_PORTAFOLIO = '/api/portafolio';
const API_ADMIN_PORTAFOLIO = '/api/admin/portafolio';

const formTrabajo = document.getElementById('form-trabajo');
const tbody = document.getElementById('tbody-trabajos');
const contador = document.getElementById('contador-trabajos');
const estadoVacio = document.getElementById('estado-vacio');
const estadoSinResultados = document.getElementById('estado-sin-resultados');
const estadoCargando = document.getElementById('estado-cargando');
const btnGuardar = document.getElementById('btn-guardar');
const btnExportar = document.getElementById('btn-exportar-portafolio');

const buscador = document.getElementById('buscador-trabajos');
const filtrosTipo = document.getElementById('filtros-tipo');
const btnLimpiar = document.getElementById('btn-limpiar');

const modalEditar = document.getElementById('modal-editar');
const modalClose = document.getElementById('modal-close');
const formEditar = document.getElementById('form-editar');
const btnCancelar = document.getElementById('btn-cancelar');
const btnActualizar = document.getElementById('btn-actualizar');

const MAX_IMAGENES_ADICIONALES = 4;
const imagenesListaForm = document.getElementById('imagenes-lista-form');
const btnAgregarImagenForm = document.getElementById('btn-agregar-imagen-form');
const contadorImagenesForm = document.getElementById('contador-imagenes-form');
const imagenesListaEdit = document.getElementById('imagenes-lista-edit');
const btnAgregarImagenEdit = document.getElementById('btn-agregar-imagen-edit');
const contadorImagenesEdit = document.getElementById('contador-imagenes-edit');

const POR_PAGINA = 10;

let trabajosOriginales = [];
let trabajosFiltrados = [];
let tipoFiltroActivo = 'Todos';
let textoBusqueda = '';
let ordenActual = { campo: null, tipo: null, direccion: 'asc' };
let paginador = null;

// UTILIDADES

function escapar(texto) {
    if (texto === null || texto === undefined) return '—';
    const div = document.createElement('div');
    div.textContent = String(texto);
    return div.innerHTML;
}

// formatea una fecha al estilo dd/mm/yyyy
// si es null o vacia, devuelve un guion
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

function parsearImagenes(imagenes) {
    if (!imagenes) return [];
    if (Array.isArray(imagenes)) return imagenes;
    if (typeof imagenes !== 'string') return [];

    try {
        const parseado = JSON.parse(imagenes);
        return Array.isArray(parseado) ? parseado : [];
    } catch (error) {
        console.warn('No se pudieron interpretar las imágenes adicionales:', error.message);
        return [];
    }
}

function crearInputImagen(url, listaId) {
    const fila = document.createElement('div');
    fila.className = 'imagen-input-fila';

    const preview = document.createElement('div');
    preview.className = 'imagen-input-preview';
    const icono = document.createElement('i');
    icono.className = 'fas fa-image';
    preview.appendChild(icono);

    const actualizarPreview = (valor) => {
        preview.replaceChildren();
        const urlImagen = valor.trim();
        if (!urlImagen) {
            preview.appendChild(icono);
            return;
        }

        const img = document.createElement('img');
        img.alt = 'Vista previa de imagen';
        img.src = urlImagen;
        img.addEventListener('error', () => {
            preview.replaceChildren(icono);
        }, { once: true });
        preview.appendChild(img);
    };

    const input = document.createElement('input');
    input.type = 'url';
    input.className = 'imagen-input-url';
    input.placeholder = 'https://ejemplo.com/imagen.jpg';
    input.value = url || '';
    input.addEventListener('input', () => actualizarPreview(input.value));
    actualizarPreview(input.value);

    const btnEliminar = document.createElement('button');
    btnEliminar.type = 'button';
    btnEliminar.className = 'btn-eliminar-imagen';
    btnEliminar.title = 'Eliminar esta imagen';
    btnEliminar.setAttribute('aria-label', 'Eliminar esta imagen');
    const iconoEliminar = document.createElement('i');
    iconoEliminar.className = 'fas fa-times';
    btnEliminar.appendChild(iconoEliminar);
    btnEliminar.addEventListener('click', () => {
        fila.remove();
        actualizarContadorImagenes(listaId);
    });

    fila.append(preview, input, btnEliminar);
    return fila;
}

function actualizarContadorImagenes(listaId) {
    const lista = listaId === 'imagenes-lista-form' ? imagenesListaForm : imagenesListaEdit;
    if (!lista) return;

    const esFormulario = listaId === 'imagenes-lista-form';
    const contador = esFormulario ? contadorImagenesForm : contadorImagenesEdit;
    const boton = esFormulario ? btnAgregarImagenForm : btnAgregarImagenEdit;
    const cantidad = lista.children.length;

    contador.textContent = `${cantidad}/${MAX_IMAGENES_ADICIONALES}`;
    boton.disabled = cantidad >= MAX_IMAGENES_ADICIONALES;
}

function agregarImagenInput(listaId, url = '') {
    const lista = listaId === 'imagenes-lista-form' ? imagenesListaForm : imagenesListaEdit;
    if (!lista) return;

    if (lista.children.length >= MAX_IMAGENES_ADICIONALES) {
        mostrarToast(`Máximo ${MAX_IMAGENES_ADICIONALES} imágenes adicionales.`, true);
        return;
    }

    lista.appendChild(crearInputImagen(url, listaId));
    actualizarContadorImagenes(listaId);
}

function cargarImagenesEnLista(listaId, imagenes) {
    const lista = listaId === 'imagenes-lista-form' ? imagenesListaForm : imagenesListaEdit;
    if (!lista) return;

    lista.replaceChildren();
    parsearImagenes(imagenes)
        .filter((url) => typeof url === 'string' && url.trim() !== '')
        .slice(0, MAX_IMAGENES_ADICIONALES)
        .forEach((url) => lista.appendChild(crearInputImagen(url, listaId)));
    actualizarContadorImagenes(listaId);
}

function obtenerImagenesDeLista(listaId) {
    const lista = listaId === 'imagenes-lista-form' ? imagenesListaForm : imagenesListaEdit;
    if (!lista) return [];

    return Array.from(lista.querySelectorAll('.imagen-input-url'))
        .map((input) => input.value.trim())
        .filter(Boolean);
}

btnAgregarImagenForm.addEventListener('click', () => agregarImagenInput('imagenes-lista-form'));
btnAgregarImagenEdit.addEventListener('click', () => agregarImagenInput('imagenes-lista-edit'));

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
    if (trabajosFiltrados.length === 0) {
        mostrarToast('No hay trabajos para exportar.', true);
        return;
    }

    const encabezados = [
        'ID',
        'Título',
        'Descripción',
        'Tipo de reparación',
        'Fecha de inicio',
        'Fecha de finalización',
        'Imagen principal',
        'Imágenes adicionales',
    ];

    const filas = trabajosFiltrados.map((t) => [
        t.id,
        t.titulo,
        t.descripcion,
        t.tipo_reparacion,
        formatearFecha(t.fecha_inicio),
        formatearFecha(t.fecha_fin),
        t.imagen_url || '',
        parsearImagenes(t.imagenes).join(' | '),
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
    const nombreArchivo = `portafolio-duotechbros-${fecha}.csv`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    mostrarToast(`Se exportaron ${trabajosFiltrados.length} trabajo${trabajosFiltrados.length !== 1 ? 's' : ''} a CSV.`);
}

// FILTROS

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

// RENDERIZADO

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

    const itemsPagina = paginador ? paginador.getItems(trabajos) : trabajos;

    itemsPagina.forEach((t) => {
        const tr = document.createElement('tr');

        const imagenesAdicionales = parsearImagenes(t.imagenes);
        const totalImagenes = (t.imagen_url ? 1 : 0) + imagenesAdicionales.length;
        const indicadorImagenes = totalImagenes > 1
            ? `<span class="indicador-carrusel" title="${totalImagenes} imágenes"><i class="fas fa-images"></i> ${totalImagenes}</span>`
            : '';
        const imagenVista = t.imagen_url || imagenesAdicionales[0];
        const imagenHTML = imagenVista
            ? `<div class="cell-imagen-wrapper">
                 <img src="${escapar(imagenVista)}" alt="${escapar(t.titulo)}" class="cell-imagen-portafolio" onerror="this.outerHTML='<div class=\\'cell-imagen-portafolio-placeholder\\'><i class=\\'fas fa-image\\'></i></div>'" />
                 ${indicadorImagenes}
               </div>`
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
            <td><span class="cell-fecha">${formatearFecha(t.fecha_inicio)}</span></td>
            <td><span class="cell-fecha">${formatearFecha(t.fecha_fin)}</span></td>
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

// APLICAR FILTROS

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

    trabajosFiltrados = filtrados;

    if (paginador) paginador.actualizar(filtrados.length, true);

    actualizarBotonLimpiar();
    renderizarTrabajos(filtrados);
}

// CARGA DE DATOS

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
            trabajosFiltrados = [];
            estadoVacio.style.display = 'block';
            contador.textContent = '0 trabajos';
            if (paginador) paginador.actualizar(0, true);
        } else {
            aplicarFiltros();
        }
    } catch (error) {
        console.error('Error al cargar trabajos:', error);
        tbody.innerHTML = '';
        trabajosFiltrados = [];
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
        fecha_inicio: document.getElementById('fecha_inicio').value || null,
        fecha_fin: document.getElementById('fecha_fin').value || null,
        imagen_url: document.getElementById('imagen_url').value.trim() || null,
        imagenes: obtenerImagenesDeLista('imagenes-lista-form'),
    };

    if (!datos.titulo) {
        mostrarToast('El título del trabajo es obligatorio.', true);
        return;
    }

    // validar que la fecha de fin no sea anterior a la de inicio
    if (datos.fecha_inicio && datos.fecha_fin) {
        if (new Date(datos.fecha_fin) < new Date(datos.fecha_inicio)) {
            mostrarToast('La fecha de finalización no puede ser anterior a la de inicio.', true);
            return;
        }
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
            mostrarToast('Trabajo publicado correctamente.');
            formTrabajo.reset();
            cargarImagenesEnLista('imagenes-lista-form', []);
            cargarTrabajos();
        } else {
            mostrarToast(`Error: ${resultado.error || 'No se pudo guardar.'}`, true);
        }
    } catch (error) {
        console.error('Error al crear trabajo:', error);
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar Trabajo';
    }
});

// MODAL

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
    document.getElementById('edit-fecha_inicio').value = trabajo.fecha_inicio || '';
    document.getElementById('edit-fecha_fin').value = trabajo.fecha_fin || '';
    document.getElementById('edit-imagen_url').value = trabajo.imagen_url || '';
    cargarImagenesEnLista('imagenes-lista-edit', trabajo.imagenes);

    modalEditar.classList.add('modal-visible');
}

function cerrarModalEdicion() {
    modalEditar.classList.remove('modal-visible');
    formEditar.reset();
    cargarImagenesEnLista('imagenes-lista-edit', []);
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

// GUARDAR CAMBIOS

formEditar.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('edit-id').value;

    const datos = {
        titulo: document.getElementById('edit-titulo').value.trim(),
        descripcion: document.getElementById('edit-descripcion').value.trim() || null,
        tipo_reparacion: document.getElementById('edit-tipo_reparacion').value || null,
        fecha_inicio: document.getElementById('edit-fecha_inicio').value || null,
        fecha_fin: document.getElementById('edit-fecha_fin').value || null,
        imagen_url: document.getElementById('edit-imagen_url').value.trim() || null,
        imagenes: obtenerImagenesDeLista('imagenes-lista-edit'),
    };

    if (!datos.titulo) {
        mostrarToast('El título del trabajo es obligatorio.', true);
        return;
    }

    // validar que la fecha de fin no sea anterior a la de inicio
    if (datos.fecha_inicio && datos.fecha_fin) {
        if (new Date(datos.fecha_fin) < new Date(datos.fecha_inicio)) {
            mostrarToast('La fecha de finalización no puede ser anterior a la de inicio.', true);
            return;
        }
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
            mostrarToast('Trabajo actualizado correctamente.');
            cerrarModalEdicion();
            cargarTrabajos();
        } else {
            mostrarToast(`Error: ${resultado.error || 'No se pudo actualizar.'}`, true);
        }
    } catch (error) {
        console.error('Error al actualizar trabajo:', error);
    } finally {
        btnActualizar.disabled = false;
        btnActualizar.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
    }
});

// ELIMINAR

async function eliminarTrabajo(id, titulo) {
    const confirmar = confirm(`¿Estás seguro de que querés eliminar "${titulo}"?`);
    if (!confirmar) return;

    try {
        const respuesta = await fetchAdmin(`${API_ADMIN_PORTAFOLIO}/${id}`, {
            method: 'DELETE',
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            mostrarToast('Trabajo eliminado.');
            cargarTrabajos();
        } else {
            mostrarToast(`Error: ${resultado.error || 'No se pudo eliminar.'}`, true);
        }
    } catch (error) {
        console.error('Error al eliminar trabajo:', error);
    }
}

// EVENTOS

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

btnExportar.addEventListener('click', exportarCSV);

// INICIO

document.addEventListener('DOMContentLoaded', () => {
    paginador = crearPaginador('paginacion-trabajos', POR_PAGINA, () => {
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
        renderizarTrabajos(filtrados);
    });

    configurarColumnasOrdenables(
        'tabla-trabajos',
        {
            1: { campo: 'titulo', tipo: 'string' },
            2: { campo: 'descripcion', tipo: 'string' },
            3: { campo: 'tipo_reparacion', tipo: 'string' },
            4: { campo: 'fecha_inicio', tipo: 'fecha' },
            5: { campo: 'fecha_fin', tipo: 'fecha' },
        },
        () => ordenActual,
        (nuevo) => { ordenActual = nuevo; },
        aplicarFiltros
    );

    setTimeout(cargarTrabajos, 100);
}); 