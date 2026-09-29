// LOGICA DE LA PAGINA DEL CARRITO DEL USUARIO

const API_CARRITO = '/api/usuarios/carrito';

// referencias a los elementos del dom
const usuarioSpan = document.getElementById('carrito-usuario');
const estadoCargando = document.getElementById('estado-cargando');
const estadoVacio = document.getElementById('estado-vacio');
const estadoError = document.getElementById('estado-error');
const carritoContenido = document.getElementById('carrito-contenido');
const carritoItems = document.getElementById('carrito-items');
const carritoCounter = document.getElementById('carrito-counter');

const resumenItems = document.getElementById('resumen-items');
const resumenUnidades = document.getElementById('resumen-unidades');
const resumenTotal = document.getElementById('resumen-total');

const btnEnviarPedido = document.getElementById('btn-enviar-pedido');
const btnVaciarCarrito = document.getElementById('btn-vaciar-carrito');

// modal de exito
const modalExito = document.getElementById('modal-exito');
const modalPedidoId = document.getElementById('modal-pedido-id');
const modalPedidoUnidades = document.getElementById('modal-pedido-unidades');
const modalPedidoTotal = document.getElementById('modal-pedido-total');

// estado local
let itemsActuales = [];

// UTILIDADES DE SESION

function estaLogueadoUsuario() {
    return (
        sessionStorage.getItem('usuarioLogueado') === 'true' &&
        !!sessionStorage.getItem('usuarioToken')
    );
}

function obtenerUsuarioActual() {
    return sessionStorage.getItem('usuarioNombre') || '';
}

function obtenerTokenUsuario() {
    return sessionStorage.getItem('usuarioToken') || '';
}

function cerrarSesionUsuario() {
    sessionStorage.removeItem('usuarioLogueado');
    sessionStorage.removeItem('usuarioNombre');
    sessionStorage.removeItem('usuarioToken');
}

// UTILIDADES GENERALES

function escapar(texto) {
    if (texto === null || texto === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(texto);
    return div.innerHTML;
}

function formatearPrecio(precio) {
    const num = Number(precio);
    if (isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
}

function mostrarToast(mensaje, tipo = 'exito') {
    const anterior = document.getElementById('toast-publico');
    if (anterior) anterior.remove();

    const toast = document.createElement('div');
    toast.id = 'toast-publico';
    toast.className = `toast-publico toast-${tipo}`;
    toast.innerHTML = `<span>${mensaje}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('toast-visible'), 10);
    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function notificarCambioCarrito() {
    document.dispatchEvent(new CustomEvent('carritoActualizado'));
}

// RENDERIZADO

function renderizarItems(items) {
    carritoItems.innerHTML = '';

    items.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'carrito-item';
        div.dataset.id = item.id;

        const imagenHTML = item.imagen_url
            ? `<img
                 src="${escapar(item.imagen_url)}"
                 alt="${escapar(item.nombre)}"
                 onerror="this.outerHTML='<i class=\\'fas fa-image\\'></i>'"
               />`
            : `<i class="fas fa-image"></i>`;

        const categoriaHTML = item.categoria
            ? `<span class="carrito-item-categoria">${escapar(item.categoria)}</span>`
            : '';

        div.innerHTML = `
            <div class="carrito-item-imagen">${imagenHTML}</div>

            <div class="carrito-item-info">
                <h3 class="carrito-item-nombre">${escapar(item.nombre)}</h3>
                ${categoriaHTML}
                <p class="carrito-item-precio-unitario">
                    Precio unitario: <strong>${formatearPrecio(item.precio)}</strong>
                </p>
            </div>

            <div class="carrito-item-acciones">
                <div class="carrito-cantidad">
                    <button
                        type="button"
                        class="carrito-cantidad-btn"
                        data-accion="restar"
                        data-id="${item.id}"
                        ${item.cantidad <= 1 ? 'disabled' : ''}
                        title="Restar 1"
                    >
                        <i class="fas fa-minus"></i>
                    </button>
                    <input
                        type="number"
                        class="carrito-cantidad-input"
                        data-id="${item.id}"
                        value="${item.cantidad}"
                        min="1"
                        max="${item.stock}"
                    />
                    <button
                        type="button"
                        class="carrito-cantidad-btn"
                        data-accion="sumar"
                        data-id="${item.id}"
                        ${item.cantidad >= item.stock ? 'disabled' : ''}
                        title="Sumar 1"
                    >
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <span class="carrito-item-subtotal">${formatearPrecio(item.subtotal)}</span>
                <button
                    type="button"
                    class="carrito-item-eliminar"
                    data-id="${item.id}"
                    title="Eliminar del carrito"
                >
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;

        carritoItems.appendChild(div);
    });

    asignarEventosItems();
}

function asignarEventosItems() {
    carritoItems.querySelectorAll('[data-accion="restar"]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const item = itemsActuales.find((i) => String(i.id) === String(id));
            if (!item || item.cantidad <= 1) return;
            cambiarCantidad(id, item.cantidad - 1, btn);
        });
    });

    carritoItems.querySelectorAll('[data-accion="sumar"]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const item = itemsActuales.find((i) => String(i.id) === String(id));
            if (!item) return;
            if (item.cantidad >= item.stock) {
                mostrarToast('No hay mas stock disponible para este producto.', 'error');
                return;
            }
            cambiarCantidad(id, item.cantidad + 1, btn);
        });
    });

    carritoItems.querySelectorAll('.carrito-cantidad-input').forEach((input) => {
        input.addEventListener('change', () => {
            const id = input.dataset.id;
            const item = itemsActuales.find((i) => String(i.id) === String(id));
            if (!item) return;

            let valor = parseInt(input.value);
            if (isNaN(valor) || valor < 1) valor = 1;
            if (valor > item.stock) {
                valor = item.stock;
                mostrarToast(`Solo hay ${item.stock} unidades disponibles.`, 'error');
            }

            if (valor === item.cantidad) {
                input.value = valor;
                return;
            }

            cambiarCantidad(id, valor, null);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                e.preventDefault();
            }
        });
    });

    carritoItems.querySelectorAll('.carrito-item-eliminar').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const item = itemsActuales.find((i) => String(i.id) === String(id));
            if (!item) return;
            if (confirm(`Queres eliminar "${item.nombre}" del carrito?`)) {
                eliminarItem(id);
            }
        });
    });
}

function actualizarResumen(resumen) {
    resumenItems.textContent = resumen.total_items;
    resumenUnidades.textContent = resumen.total_unidades;
    resumenTotal.textContent = formatearPrecio(resumen.total_precio);
    carritoCounter.textContent = `${resumen.total_items} item${resumen.total_items !== 1 ? 's' : ''}`;

    btnEnviarPedido.disabled = resumen.total_items === 0;
}

// CARGAR CARRITO

async function cargarCarrito() {
    estadoCargando.style.display = 'block';
    estadoVacio.style.display = 'none';
    estadoError.style.display = 'none';
    carritoContenido.style.display = 'none';
    carritoItems.innerHTML = '';

    try {
        const respuesta = await fetch(API_CARRITO, {
            headers: {
                Authorization: `Bearer ${obtenerTokenUsuario()}`,
            },
        });

        if (respuesta.status === 401) {
            cerrarSesionUsuario();
            window.location.href = '/user/login.html';
            return;
        }

        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

        const data = await respuesta.json();
        itemsActuales = data.items || [];

        if (itemsActuales.length === 0) {
            estadoVacio.style.display = 'block';
        } else {
            carritoContenido.style.display = 'block';
            renderizarItems(itemsActuales);
            actualizarResumen(data.resumen);
        }
    } catch (error) {
        console.error('Error al cargar carrito:', error);
        estadoError.style.display = 'block';
    } finally {
        estadoCargando.style.display = 'none';
    }
}

// CAMBIAR CANTIDAD

async function cambiarCantidad(id, nuevaCantidad, btnElement) {
    if (btnElement) btnElement.disabled = true;

    try {
        const respuesta = await fetch(`${API_CARRITO}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${obtenerTokenUsuario()}`,
            },
            body: JSON.stringify({ cantidad: nuevaCantidad }),
        });

        const resultado = await respuesta.json();

        if (respuesta.status === 401) {
            cerrarSesionUsuario();
            window.location.href = '/user/login.html';
            return;
        }

        if (resultado.success) {
            await cargarCarrito();
            notificarCambioCarrito();
        } else {
            mostrarToast(resultado.error || 'No se pudo actualizar la cantidad.', 'error');
            await cargarCarrito();
        }
    } catch (error) {
        console.error('Error al cambiar cantidad:', error);
        mostrarToast('No se pudo conectar con el servidor.', 'error');
        await cargarCarrito();
    } finally {
        if (btnElement) btnElement.disabled = false;
    }
}

// ELIMINAR ITEM

async function eliminarItem(id) {
    try {
        const respuesta = await fetch(`${API_CARRITO}/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${obtenerTokenUsuario()}`,
            },
        });

        const resultado = await respuesta.json();

        if (respuesta.status === 401) {
            cerrarSesionUsuario();
            window.location.href = '/user/login.html';
            return;
        }

        if (resultado.success) {
            mostrarToast('Producto eliminado del carrito.', 'exito');
            await cargarCarrito();
            notificarCambioCarrito();
        } else {
            mostrarToast(resultado.error || 'No se pudo eliminar el producto.', 'error');
        }
    } catch (error) {
        console.error('Error al eliminar item:', error);
        mostrarToast('No se pudo conectar con el servidor.', 'error');
    }
}

// VACIAR CARRITO

async function vaciarCarrito() {
    if (!confirm('Estas seguro de que queres vaciar todo el carrito?')) return;

    btnVaciarCarrito.disabled = true;
    const contenidoOriginal = btnVaciarCarrito.innerHTML;
    btnVaciarCarrito.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Vaciando...';

    try {
        const respuesta = await fetch(API_CARRITO, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${obtenerTokenUsuario()}`,
            },
        });

        const resultado = await respuesta.json();

        if (respuesta.status === 401) {
            cerrarSesionUsuario();
            window.location.href = '/user/login.html';
            return;
        }

        if (resultado.success) {
            mostrarToast('Carrito vaciado correctamente.', 'exito');
            await cargarCarrito();
            notificarCambioCarrito();
        } else {
            mostrarToast(resultado.error || 'No se pudo vaciar el carrito.', 'error');
        }
    } catch (error) {
        console.error('Error al vaciar carrito:', error);
        mostrarToast('No se pudo conectar con el servidor.', 'error');
    } finally {
        btnVaciarCarrito.disabled = false;
        btnVaciarCarrito.innerHTML = contenidoOriginal;
    }
}

// ENVIAR PEDIDO

async function enviarPedido() {
    // confirmar antes de enviar
    const confirmar = confirm(
        'Confirmas el envio de tu pedido?\n\nAl enviarlo, se descontara el stock de los productos.'
    );
    if (!confirmar) return;

    btnEnviarPedido.disabled = true;
    const contenidoOriginal = btnEnviarPedido.innerHTML;
    btnEnviarPedido.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando pedido...';

    try {
        const respuesta = await fetch(`${API_CARRITO}/enviar-pedido`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${obtenerTokenUsuario()}`,
            },
        });

        const resultado = await respuesta.json();

        if (respuesta.status === 401) {
            cerrarSesionUsuario();
            window.location.href = '/user/login.html';
            return;
        }

        if (resultado.success) {
            // mostrar el modal de exito
            modalPedidoId.textContent = `#${String(resultado.pedido_id).padStart(4, '0')}`;
            modalPedidoUnidades.textContent = resultado.unidades;
            modalPedidoTotal.textContent = formatearPrecio(resultado.total);
            modalExito.classList.add('modal-visible');

            // limpiar el carrito y notificar al header
            itemsActuales = [];
            notificarCambioCarrito();
        } else {
            // error del backend (ej: falta de stock)
            let mensaje = resultado.error || 'No se pudo enviar el pedido.';
            if (resultado.detalle && Array.isArray(resultado.detalle)) {
                mensaje += '\n\n' + resultado.detalle.join('\n');
            }
            alert(mensaje);
            // recargar el carrito por si cambio el stock
            await cargarCarrito();
        }
    } catch (error) {
        console.error('Error al enviar pedido:', error);
        mostrarToast('No se pudo conectar con el servidor.', 'error');
    } finally {
        btnEnviarPedido.disabled = false;
        btnEnviarPedido.innerHTML = contenidoOriginal;
    }
}

// EVENTOS

btnEnviarPedido.addEventListener('click', enviarPedido);
btnVaciarCarrito.addEventListener('click', vaciarCarrito);

// INICIO

document.addEventListener('DOMContentLoaded', () => {
    if (!estaLogueadoUsuario()) {
        window.location.href = '/user/login.html';
        return;
    }

    if (usuarioSpan) {
        usuarioSpan.innerHTML = `<i class="fas fa-user-circle"></i> ${obtenerUsuarioActual()}`;
    }

    cargarCarrito();
});