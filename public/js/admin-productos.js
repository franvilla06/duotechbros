// ============================================================
// LÓGICA DE LA PÁGINA "GESTIONAR PRODUCTOS" - DuotechBros Admin
// Incluye: crear, editar, eliminar, buscar y filtrar
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

// Búsqueda y filtros
const buscador = document.getElementById('buscador-productos');
const filtrosCategoria = document.getElementById('filtros-categoria');
const btnLimpiar = document.getElementById('btn-limpiar');

// Modal de edición
const modalEditar = document.getElementById('modal-editar');
const modalClose = document.getElementById('modal-close');
const formEditar = document.getElementById('form-editar');
const btnCancelar = document.getElementById('btn-cancelar');
const btnActualizar = document.getElementById('btn-actualizar');

// Estado local
let productosOriginales = [];
let categoriaFiltroActivo = 'Todas';
let textoBusqueda = '';

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

    productos.forEach((p) => {
        const tr = document.createElement('tr');

        const imagenHTML = p.imagen_url
            ? `<img src="${escapar(p.imagen_url)}" alt="${escapar(p.nombre)}" class="cell-imagen" onerror="this.outerHTML='<div class=\\'cell-imagen-placeholder\\'><i class=\\'fas fa-image\\'></i></div>'" />`
            : `<div class="cell-imagen-placeholder"><i class="fas fa-image"></i></div>`;

        tr.innerHTML = `
            <td>${imagenHTML}</td>
            <td><span class="cell-nombre">${escapar(p.nombre)}</span></td>
            <td>
                <div class="cell-descripcion" title="${escapar(p.descripcion)}">
                    ${escapar(p.descripcion)}
                </div>
            </td>
            <td>${escapar(p.categoria)}</td>
            <td><span class="cell-precio">${formatearPrecio(p.precio)}</span></td>
            <td><span class="badge ${claseStock(p.stock)}">${escapar(p.stock)} ud.</span></td>
            <td style="text-align: right">
                <button class="btn-editar" title="Editar" data-id="${p.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-eliminar" title="Eliminar" data-id="${p.id}" data-nombre="${escapar(p.nombre)}">
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
            eliminarProducto(btn.dataset.id, btn.dataset.nombre);
        });
    });
}

// ----- APLICAR FILTROS -----

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

        // Reconstruir filtros (por si aparecieron nuevas categorías)
        construirFiltrosCategoria();

        if (productos.length === 0) {
            estadoVacio.style.display = 'block';
            contador.textContent = '0 productos';
        } else {
            aplicarFiltros();
        }
    } catch (error) {
        console.error('Error al cargar productos:', error);
        tbody.innerHTML = '';
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

// ----- MODAL: ABRIR Y CERRAR -----

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
        nombre: document.getElementById('edit-nombre').value.trim(),
        descripcion: document.getElementById('edit-descripcion').value.trim() || null,
        precio: parseFloat(document.getElementById('edit-precio').value),
        stock: parseInt(document.getElementById('edit-stock').value) || 0,
        categoria: document.getElementById('edit-categoria').value.trim() || null,
        imagen_url: document.getElementById('edit-imagen_url').value.trim() || null,
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

// ----- INICIO -----

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(cargarProductos, 100);
});