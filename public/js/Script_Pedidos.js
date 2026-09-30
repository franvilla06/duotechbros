// LOGICA DEL FORMULARIO DE PEDIDOS DE REPARACION
// requiere estar logueado para enviar
// los datos se guardan temporalmente para no perderlos si hay que loguearse

const form = document.getElementById('form-pedido');
const mensajeDiv = document.getElementById('mensaje');

const STORAGE_KEY = 'pedidoBorrador';

// UTILIDADES DE SESION

function estaLogueadoUsuario() {
    return (
        sessionStorage.getItem('usuarioLogueado') === 'true' &&
        !!sessionStorage.getItem('usuarioToken')
    );
}

function obtenerTokenUsuario() {
    return sessionStorage.getItem('usuarioToken') || '';
}

// FUNCION PARA MOSTRAR MENSAJES

function mostrarMensaje(texto, tipo) {
    mensajeDiv.textContent = texto;
    mensajeDiv.className = `mensaje ${tipo}`;
    mensajeDiv.style.display = 'block';

    setTimeout(() => {
        mensajeDiv.style.display = 'none';
    }, 5000);
}

// VALIDACIONES

function esEmailValido(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function esTelefonoValido(telefono) {
    const soloNumeros = /^[0-9]+$/.test(telefono);
    return soloNumeros && telefono.length >= 7;
}

function validarFormulario(datos) {
    if (!datos.nombre_cliente || datos.nombre_cliente.trim().length < 3) {
        mostrarMensaje('El nombre debe tener al menos 3 caracteres.', 'error');
        return false;
    }

    if (!datos.email || !esEmailValido(datos.email)) {
        mostrarMensaje('Ingresa un email valido (ej: usuario@dominio.com).', 'error');
        return false;
    }

    if (datos.telefono && datos.telefono.trim() !== '') {
        if (!esTelefonoValido(datos.telefono)) {
            mostrarMensaje('El telefono debe contener solo numeros y tener al menos 7 digitos.', 'error');
            return false;
        }
    }

    if (!datos.modelo_celular || datos.modelo_celular.trim().length < 2) {
        mostrarMensaje('Ingresa el modelo del celular.', 'error');
        return false;
    }

    if (!datos.descripcion_problema || datos.descripcion_problema.trim().length < 10) {
        mostrarMensaje('La descripcion debe tener al menos 10 caracteres.', 'error');
        return false;
    }

    return true;
}

// GUARDAR / RESTAURAR DATOS DEL FORMULARIO

function guardarBorrador(datos) {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
    } catch (error) {
        console.warn('No se pudo guardar el borrador:', error.message);
    }
}

function restaurarBorrador() {
    try {
        const guardado = sessionStorage.getItem(STORAGE_KEY);
        if (!guardado) return;

        const datos = JSON.parse(guardado);
        if (datos.nombre_cliente) document.getElementById('nombre_cliente').value = datos.nombre_cliente;
        if (datos.email) document.getElementById('email').value = datos.email;
        if (datos.telefono) document.getElementById('telefono').value = datos.telefono;
        if (datos.modelo_celular) document.getElementById('modelo_celular').value = datos.modelo_celular;
        if (datos.descripcion_problema) document.getElementById('descripcion_problema').value = datos.descripcion_problema;

        // mostrar un aviso de que se restauro el borrador
        mostrarMensaje('Se restauraron los datos que habias cargado antes de iniciar sesion.', 'exito');

        // eliminar el borrador
        sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.warn('No se pudo restaurar el borrador:', error.message);
    }
}

// EVENTO SUBMIT DEL FORMULARIO

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const datos = {
        nombre_cliente: document.getElementById('nombre_cliente').value.trim(),
        email: document.getElementById('email').value.trim(),
        telefono: document.getElementById('telefono').value.trim(),
        modelo_celular: document.getElementById('modelo_celular').value.trim(),
        descripcion_problema: document.getElementById('descripcion_problema').value.trim(),
    };

    if (!validarFormulario(datos)) {
        return;
    }

    // si no esta logueado, guardar el borrador y redirigir al login
    if (!estaLogueadoUsuario()) {
        guardarBorrador(datos);

        // mostrar mensaje antes de redirigir
        mostrarMensaje('Necesitas iniciar sesion para enviar el pedido. Redirigiendo...', 'error');

        setTimeout(() => {
            window.location.href = '/user/login.html?redirect=/pedidos.html';
        }, 1500);
        return;
    }

    // deshabilitar el boton mientras se envia
    const boton = form.querySelector('button[type="submit"]');
    boton.disabled = true;
    boton.textContent = 'Enviando...';

    try {
        const respuesta = await fetch('/api/pedidos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${obtenerTokenUsuario()}`,
            },
            body: JSON.stringify(datos),
        });

        // si expiro el token, redirigir al login
        if (respuesta.status === 401) {
            sessionStorage.removeItem('usuarioLogueado');
            sessionStorage.removeItem('usuarioNombre');
            sessionStorage.removeItem('usuarioToken');
            mostrarMensaje('Tu sesion expiro. Redirigiendo al login...', 'error');
            setTimeout(() => {
                window.location.href = '/user/login.html?redirect=/pedidos.html';
            }, 1500);
            return;
        }

        const resultado = await respuesta.json();

        if (resultado.success) {
            mostrarMensaje('Pedido enviado con exito.', 'exito');
            form.reset();
        } else {
            mostrarMensaje(`Error: ${resultado.error}`, 'error');
        }
    } catch (error) {
        mostrarMensaje('No se pudo conectar con el servidor.', 'error');
        console.error('Error de conexion:', error);
    } finally {
        boton.disabled = false;
        boton.textContent = 'Enviar pedido';
    }
});

// VALIDACIONES EN TIEMPO REAL

document.getElementById('nombre_cliente').addEventListener('blur', function () {
    if (this.value.trim().length < 3) {
        this.style.borderColor = '#dc3545';
    } else {
        this.style.borderColor = '#28a745';
    }
});

document.getElementById('email').addEventListener('blur', function () {
    if (!esEmailValido(this.value.trim())) {
        this.style.borderColor = '#dc3545';
    } else {
        this.style.borderColor = '#28a745';
    }
});

document.getElementById('telefono').addEventListener('blur', function () {
    const valor = this.value.trim();
    if (valor && !esTelefonoValido(valor)) {
        this.style.borderColor = '#dc3545';
    } else {
        this.style.borderColor = '#28a745';
    }
});

document.getElementById('modelo_celular').addEventListener('blur', function () {
    if (this.value.trim().length < 2) {
        this.style.borderColor = '#dc3545';
    } else {
        this.style.borderColor = '#28a745';
    }
});

document.getElementById('descripcion_problema').addEventListener('blur', function () {
    if (this.value.trim().length < 10) {
        this.style.borderColor = '#dc3545';
    } else {
        this.style.borderColor = '#28a745';
    }
});

// INICIO

document.addEventListener('DOMContentLoaded', () => {
    // si volvimos del login con un borrador guardado, restaurarlo
    restaurarBorrador();
});