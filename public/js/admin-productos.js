// ============================================================
// LÓGICA DE LA PÁGINA "GESTIONAR PRODUCTOS" - DuotechBros Admin
// ============================================================

const API_PRODUCTOS = '/api/productos';
const API_ADMIN_PRODUCTOS = '/api/admin/productos';

const formProducto = document.getElementById('form-producto');
const tbody = document.getElementById('tbody-productos');
const contador = document.getElementById('contador-productos');
const estadoVacio = document.getElementById('estado-vacio');
const estadoSinResultados = document.getElementById('estado-sin-resultados');
const estadoCargando = document.getElementById('estado-cargando');
const btnGuardar = document.getElementById('btn-guardar');
const btnExportar = document.getElementById('btn-exportar-productos');

const buscador = document.getElementById('buscador-productos');
const filtrosCategoria = document.getElementById('filtros-categoria');
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

// Estado local
let productosOriginales = [];
let productosFiltrados = [];   // ← nuevo
let categoriaFiltroActivo = 'Todas';
let textoBusqueda = '';
let ordenActual = { campo: null, tipo: null, direccion: 'asc' };
let paginador = null;

// ----- UTILIDADES -----

function escapar(texto) {
    if (texto === null || texto === undefined) return '—';
    const div = document.createElement('div');
    div.textContent = String(texto);
    return div.innerHTML;
}

function formatearPrecio(precio) {
    const num = Number(precio);
    if (isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
}

function claseStock(stock) {
    const s = Number(stock);
    if (s <= 0) return 'badge-stock-agotado';
    if (s <= 3) return 'badge-stock-bajo';
    return 'badge-stock';
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

// ----- EXPORTAR A CSV -----

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

async function exportarCSV() {
    if (productosFiltrados.length === 0) {
        mostrarToast('No hay productos para exportar.', true);
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
        'Nombre',
        'Descripción',
        'Categoría',
        'Precio',
        'Stock',
        'Imagen principal',
        'Imágenes adicionales',
    ];

    const filas = productosFiltrados.map((p) => [
        p.id,
        p.nombre,
        p.descripcion,
        p.categoria,
        p.precio,
        p.stock,
        p.imagen_url || '',
        parsearImagenes(p.imagenes).join(' | '),
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
    const nombreArchivo = `productos-${marcaSlug}-${fecha}.csv`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    mostrarToast(`✅ Se exportaron ${productosFiltrados.length} producto${productosFiltrados.length !== 1 ? 's' : ''} a CSV.`);
}

// ----- FILTROS -----

function construirFiltrosCategoria() {
    const categorias = ['Todas'];
    productosOriginales.forEach((p) => {
        if (p.categoria && !categorias.includes(p.categoria)) {
            categorias.push(p.categoria);
        }
    });

    filtrosCategoria.innerHTML = '';

    categorias.forEach((cat) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'filtro-chip' + (cat === categoriaFiltroActivo ? ' active' : '');
        chip.dataset.categoria = cat;
        chip.textContent = cat;

        chip.addEventListener('click', () => {
            categoriaFiltroActivo = cat;
            filtrosCategoria.querySelectorAll('.filtro-chip').forEach((c) => {
                c.classList.toggle('active', c.dataset.categoria === cat);
            });
            aplicarFiltros();
        });

        filtrosCategoria.appendChild(chip);
    });
}

function actualizarBotonLimpiar() {
    const hayFiltro = categoriaFiltroActivo !== 'Todas' || textoBusqueda.trim() !== '';
    btnLimpiar.disabled = !hayFiltro;
}

// ----- RENDERIZADO -----

function renderizarProductos(productos) {
    tbody.innerHTML = '';

    if (productos.length === 0) {
        if (productosOriginales.length === 0) {
            estadoVacio.style.display = 'block';
        } else {
            estadoSinResultados.style.display = 'block';
        }
        contador.textContent = '0 productos';
        return;
    }

    contador.textContent = `${productos.length} producto${productos.length !== 1 ? 's' : ''}`;

    const itemsPagina = paginador ? paginador.getItems(productos) : productos;

    itemsPagina.forEach((p) => {
        const imagenesAdicionales = parsearImagenes(p.imagenes);
        const totalImagenes = (p.imagen_url ? 1 : 0) + imagenesAdicionales.length;
        const indicadorImagenes = totalImagenes > 1
            ? `<span class="indicador-carrusel" title="${totalImagenes} imágenes"><i class="fas fa-images"></i> ${totalImagenes}</span>`
            : '';
        const imagenVista = p.imagen_url || imagenesAdicionales[0];
        const imagenHTML = imagenVista
            ? `<div class="cell-imagen-wrapper">
                 <img src="${escapar(imagenVista)}" alt="${escapar(p.nombre)}" class="cell-imagen" onerror="this.outerHTML='<div class=\\'cell-imagen-placeholder\\'><i class=\\'fas fa-image\\'></i></div>'" />
                 ${indicadorImagenes}
               </div>`
            : `<div class="cell-imagen-placeholder"><i class="fas fa-image"></i></div>`;

        const tr = document.createElement('tr');
        tr.className = 'prod-fila';
        tr.dataset.id = p.id;
        tr.innerHTML = `
            <td class="cell-producto-principal" data-label="">
                <div class="cell-producto-contenido">
                    ${imagenHTML}
                    <span class="cell-nombre">${escapar(p.nombre)}</span>
                </div>
            </td>
            <td>
                <div class="cell-descripcion" title="${escapar(p.descripcion)}">
                    ${escapar(p.descripcion)}
                </div>
            </td>
            <td>${escapar(p.categoria)}</td>
            <td class="cell-precio-stock">
                <div class="cell-precio-stock-contenido">
                    <span class="cell-precio">${formatearPrecio(p.precio)}</span>
                    <span class="badge ${claseStock(p.stock)}">${escapar(p.stock)} ud.</span>
                </div>
            </td>
            <td class="cell-acciones" style="text-align: right">
                <div class="cell-acciones-contenido">
                    <button class="btn-editar" title="Editar" data-id="${p.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-eliminar" title="Eliminar" data-id="${p.id}" data-nombre="${escapar(p.nombre)}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
                <span class="fila-chevron"><i class="fas fa-chevron-down"></i></span>
            </td>
        `;

        const trDetalle = document.createElement('tr');
        trDetalle.className = 'prod-detalle-fila';
        trDetalle.dataset.id = p.id;
        trDetalle.innerHTML = `
            <td colspan="5">
                <div class="fila-detalle-contenido">
                    <div class="fila-detalle-linea">
                        <span class="fila-detalle-label">Imagen</span>
                        <span class="fila-detalle-valor fila-detalle-valor-imagen">${imagenHTML}</span>
                    </div>
                    <div class="fila-detalle-linea">
                        <span class="fila-detalle-label">Nombre</span>
                        <span class="fila-detalle-valor">${escapar(p.nombre)}</span>
                    </div>
                    <div class="fila-detalle-linea">
                        <span class="fila-detalle-label">Descripción</span>
                        <span class="fila-detalle-valor">${escapar(p.descripcion) || '—'}</span>
                    </div>
                    <div class="fila-detalle-linea">
                        <span class="fila-detalle-label">Categoría</span>
                        <span class="fila-detalle-valor">${escapar(p.categoria) || '—'}</span>
                    </div>
                    <div class="fila-detalle-linea">
                        <span class="fila-detalle-label">Precio</span>
                        <span class="fila-detalle-valor"><span class="cell-precio">${formatearPrecio(p.precio)}</span></span>
                    </div>
                    <div class="fila-detalle-linea">
                        <span class="fila-detalle-label">Stock</span>
                        <span class="fila-detalle-valor"><span class="badge ${claseStock(p.stock)}">${escapar(p.stock)} ud.</span></span>
                    </div>
                    <div class="fila-detalle-acciones">
                        <button class="btn-editar" title="Editar" data-id="${p.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-eliminar" title="Eliminar" data-id="${p.id}" data-nombre="${escapar(p.nombre)}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            </td>
        `;

        tr.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            toggleDetalleProducto(p.id);
        });

        tbody.appendChild(tr);
        tbody.appendChild(trDetalle);
    });

    tbody.querySelectorAll('.btn-editar').forEach((btn) => {
        btn.addEventListener('click', () => abrirModalEdicion(btn.dataset.id));
    });

    tbody.querySelectorAll('.btn-eliminar').forEach((btn) => {
        btn.addEventListener('click', () => {
            eliminarProducto(btn.dataset.id, btn.dataset.nombre);
        });
    });
}

function toggleDetalleProducto(id) {
    if (window.innerWidth > 700) return;

    const filaPrincipal = tbody.querySelector(`.prod-fila[data-id="${id}"]`);
    const filaDetalle = tbody.querySelector(`.prod-detalle-fila[data-id="${id}"]`);
    if (!filaPrincipal || !filaDetalle) return;

    const estabaAbierta = filaDetalle.classList.contains('fila-detalle-visible');

    tbody.querySelectorAll('.prod-detalle-fila').forEach((fila) => {
        fila.classList.remove('fila-detalle-visible');
    });
    tbody.querySelectorAll('.prod-fila').forEach((fila) => {
        fila.classList.remove('fila-abierta');
    });

    if (!estabaAbierta) {
        filaDetalle.classList.add('fila-detalle-visible');
        filaPrincipal.classList.add('fila-abierta');
    }
}

// ----- APLICAR FILTROS + ORDEN + PAGINACIÓN -----

function aplicarFiltros() {
    estadoVacio.style.display = 'none';
    estadoSinResultados.style.display = 'none';

    let filtrados = [...productosOriginales];

    if (categoriaFiltroActivo !== 'Todas') {
        filtrados = filtrados.filter((p) => p.categoria === categoriaFiltroActivo);
    }

    if (textoBusqueda.trim() !== '') {
        const q = textoBusqueda.trim().toLowerCase();
        filtrados = filtrados.filter(
            (p) =>
                (p.nombre && p.nombre.toLowerCase().includes(q)) ||
                (p.descripcion && p.descripcion.toLowerCase().includes(q)) ||
                (p.categoria && p.categoria.toLowerCase().includes(q))
        );
    }

    filtrados = aplicarOrdenamiento(filtrados);

    productosFiltrados = filtrados;   // ← guardar para exportar

    if (paginador) paginador.actualizar(filtrados.length, true);

    actualizarBotonLimpiar();
    renderizarProductos(filtrados);
}

// ----- CARGA DE DATOS -----

async function cargarProductos() {
    estadoCargando.style.display = 'block';
    estadoVacio.style.display = 'none';
    estadoSinResultados.style.display = 'none';
    tbody.innerHTML = '';

    try {
        const respuesta = await fetch(API_PRODUCTOS);
        if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
        const productos = await respuesta.json();

        productosOriginales = productos;
        construirFiltrosCategoria();

        if (productos.length === 0) {
            productosFiltrados = [];
            estadoVacio.style.display = 'block';
            contador.textContent = '0 productos';
            if (paginador) paginador.actualizar(0, true);
        } else {
            aplicarFiltros();
        }
    } catch (error) {
        console.error('Error al cargar productos:', error);
        tbody.innerHTML = '';
        productosFiltrados = [];
        estadoVacio.style.display = 'block';
        estadoVacio.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="color:#d9534f"></i>
            <p>No se pudieron cargar los productos</p>
            <small>Verificá que el servidor esté corriendo e intentá de nuevo.</small>
        `;
    } finally {
        estadoCargando.style.display = 'none';
    }
}

// ----- CREAR PRODUCTO -----

formProducto.addEventListener('submit', async (e) => {
    e.preventDefault();

    const datos = {
        nombre: document.getElementById('nombre').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim() || null,
        precio: parseFloat(document.getElementById('precio').value),
        stock: parseInt(document.getElementById('stock').value) || 0,
        categoria: document.getElementById('categoria').value.trim() || null,
        imagen_url: document.getElementById('imagen_url').value.trim() || null,
        imagenes: obtenerImagenesDeLista('imagenes-lista-form'),
    };

    if (!datos.nombre) {
        mostrarToast('El nombre del producto es obligatorio.', true);
        return;
    }
    if (isNaN(datos.precio) || datos.precio < 0) {
        mostrarToast('Ingresá un precio válido.', true);
        return;
    }

    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    try {
        const respuesta = await fetchAdmin(API_ADMIN_PRODUCTOS, {
            method: 'POST',
            body: JSON.stringify(datos),
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            mostrarToast('✅ Producto agregado correctamente.');
            formProducto.reset();
            document.getElementById('stock').value = '0';
            cargarImagenesEnLista('imagenes-lista-form', []);
            cargarProductos();
        } else {
            mostrarToast(`❌ Error: ${resultado.error || 'No se pudo guardar.'}`, true);
        }
    } catch (error) {
        console.error('Error al crear producto:', error);
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar Producto';
    }
});

// ----- MODAL -----

function abrirModalEdicion(id) {
    const producto = productosOriginales.find((p) => String(p.id) === String(id));
    if (!producto) {
        mostrarToast('No se encontró el producto.', true);
        return;
    }

    document.getElementById('edit-id').value = producto.id;
    document.getElementById('edit-nombre').value = producto.nombre || '';
    document.getElementById('edit-descripcion').value = producto.descripcion || '';
    document.getElementById('edit-precio').value = producto.precio || '';
    document.getElementById('edit-stock').value = producto.stock || 0;
    document.getElementById('edit-categoria').value = producto.categoria || '';
    document.getElementById('edit-imagen_url').value = producto.imagen_url || '';
    cargarImagenesEnLista('imagenes-lista-edit', producto.imagenes);

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

// ----- GUARDAR CAMBIOS -----

formEditar.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('edit-id').value;

    const datos = {
        nombre: document.getElementById('edit-nombre').value.trim(),
        descripcion: document.getElementById('edit-descripcion').value.trim() || null,
        precio: parseFloat(document.getElementById('edit-precio').value),
        stock: parseInt(document.getElementById('edit-stock').value) || 0,
        categoria: document.getElementById('edit-categoria').value.trim() || null,
        imagen_url: document.getElementById('edit-imagen_url').value.trim() || null,
        imagenes: obtenerImagenesDeLista('imagenes-lista-edit'),
    };

    if (!datos.nombre) {
        mostrarToast('El nombre del producto es obligatorio.', true);
        return;
    }
    if (isNaN(datos.precio) || datos.precio < 0) {
        mostrarToast('Ingresá un precio válido.', true);
        return;
    }

    btnActualizar.disabled = true;
    btnActualizar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    try {
        const respuesta = await fetchAdmin(`${API_ADMIN_PRODUCTOS}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(datos),
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            mostrarToast('✅ Producto actualizado correctamente.');
            cerrarModalEdicion();
            cargarProductos();
        } else {
            mostrarToast(`❌ Error: ${resultado.error || 'No se pudo actualizar.'}`, true);
        }
    } catch (error) {
        console.error('Error al actualizar producto:', error);
    } finally {
        btnActualizar.disabled = false;
        btnActualizar.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
    }
});

// ----- ELIMINAR -----

async function eliminarProducto(id, nombre) {
    const confirmar = confirm(`¿Estás seguro de que querés eliminar "${nombre}"?`);
    if (!confirmar) return;

    try {
        const respuesta = await fetchAdmin(`${API_ADMIN_PRODUCTOS}/${id}`, {
            method: 'DELETE',
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            mostrarToast('✅ Producto eliminado.');
            cargarProductos();
        } else {
            mostrarToast(`❌ Error: ${resultado.error || 'No se pudo eliminar.'}`, true);
        }
    } catch (error) {
        console.error('Error al eliminar producto:', error);
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
    categoriaFiltroActivo = 'Todas';
    filtrosCategoria.querySelectorAll('.filtro-chip').forEach((c) => {
        c.classList.toggle('active', c.dataset.categoria === 'Todas');
    });
    aplicarFiltros();
});

btnExportar.addEventListener('click', exportarCSV);

// ----- INICIO -----

document.addEventListener('DOMContentLoaded', () => {
    paginador = crearPaginador('paginacion-productos', POR_PAGINA, () => {
        let filtrados = [...productosOriginales];
        if (categoriaFiltroActivo !== 'Todas') {
            filtrados = filtrados.filter((p) => p.categoria === categoriaFiltroActivo);
        }
        if (textoBusqueda.trim() !== '') {
            const q = textoBusqueda.trim().toLowerCase();
            filtrados = filtrados.filter(
                (p) =>
                    (p.nombre && p.nombre.toLowerCase().includes(q)) ||
                    (p.descripcion && p.descripcion.toLowerCase().includes(q)) ||
                    (p.categoria && p.categoria.toLowerCase().includes(q))
            );
        }
        filtrados = aplicarOrdenamiento(filtrados);
        renderizarProductos(filtrados);
    });

    configurarColumnasOrdenables(
        'tabla-productos',
        {
            0: { campo: 'nombre', tipo: 'string' },
            1: { campo: 'descripcion', tipo: 'string' },
            2: { campo: 'categoria', tipo: 'string' },
            3: { campo: 'stock', tipo: 'numero' },
        },
        () => ordenActual,
        (nuevo) => { ordenActual = nuevo; },
        aplicarFiltros
    );

    setTimeout(cargarProductos, 100);
});