// LÓGICA DE LA PÁGINA "GESTIONAR PRODUCTOS"

const API_PRODUCTOS = '/api/productos';
const API_ADMIN_PRODUCTOS = '/api/admin/productos';

const formProducto = document.getElementById('form-producto');
const tbody = document.getElementById('tbody-productos');
const contador = document.getElementById('contador-productos');
const estadoVacio = document.getElementById('estado-vacio');
const estadoCargando = document.getElementById('estado-cargando');
const btnGuardar = document.getElementById('btn-guardar');

//  UTILIDADES 

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

//  RENDERIZADO 

function renderizarProductos(productos) {
    tbody.innerHTML = '';

    if (!productos || productos.length === 0) {
        estadoVacio.style.display = 'block';
        contador.textContent = '0 productos';
        return;
    }

    estadoVacio.style.display = 'none';
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
            <td>
                <span class="badge ${claseStock(p.stock)}">${escapar(p.stock)} ud.</span>
            </td>
            <td style="text-align: right">
                <button class="btn-eliminar" title="Eliminar" data-id="${p.id}" data-nombre="${escapar(p.nombre)}">
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
            const nombre = btn.dataset.nombre;
            eliminarProducto(id, nombre);
        });
    });
}

//  CARGA DE DATOS 

async function cargarProductos() {
    estadoCargando.style.display = 'block';
    estadoVacio.style.display = 'none';
    tbody.innerHTML = '';

    try {
        const respuesta = await fetch(API_PRODUCTOS);
        if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
        const productos = await respuesta.json();
        renderizarProductos(productos);
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

//  CREAR PRODUCTO 

formProducto.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Recolectar y limpiar datos
    const datos = {
        nombre: document.getElementById('nombre').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim() || null,
        precio: parseFloat(document.getElementById('precio').value),
        stock: parseInt(document.getElementById('stock').value) || 0,
        categoria: document.getElementById('categoria').value.trim() || null,
        imagen_url: document.getElementById('imagen_url').value.trim() || null,
    };

    // Validaciones
    if (!datos.nombre) {
        alert('El nombre del producto es obligatorio.');
        return;
    }
    if (isNaN(datos.precio) || datos.precio < 0) {
        alert('Ingresá un precio válido.');
        return;
    }

    // Deshabilitar botón
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    try {
        const respuesta = await fetchAdmin(API_ADMIN_PRODUCTOS, {
            method: 'POST',
            body: JSON.stringify(datos),
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            alert('Producto agregado correctamente.');
            formProducto.reset();
            document.getElementById('stock').value = '0';
            cargarProductos();
        } else {
            alert(`Error: ${resultado.error || 'No se pudo guardar el producto.'}`);
        }
    } catch (error) {
        console.error('Error al crear producto:', error);
        // fetchAdmin ya maneja el 401
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar Producto';
    }
});

//  ELIMINAR PRODUCTO 

async function eliminarProducto(id, nombre) {
    const confirmar = confirm(`¿Estás seguro de que querés eliminar "${nombre}"?`);
    if (!confirmar) return;

    try {
        const respuesta = await fetchAdmin(`${API_ADMIN_PRODUCTOS}/${id}`, {
            method: 'DELETE',
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            alert('Producto eliminado.');
            cargarProductos();
        } else {
            alert(`Error: ${resultado.error || 'No se pudo eliminar el producto.'}`);
        }
    } catch (error) {
        console.error('Error al eliminar producto:', error);
    }
}

//  INICIO 

document.addEventListener('DOMContentLoaded', () => {
    // Espera breve para que protegerPagina() de admin.js corra primero
    setTimeout(cargarProductos, 100);
});