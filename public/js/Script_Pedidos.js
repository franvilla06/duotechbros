const form = document.getElementById('form-pedido');
const mensajeDiv = document.getElementById('mensaje');

// FUNCIÓN PARA MOSTRAR MENSAJES
function mostrarMensaje(texto, tipo) {
    mensajeDiv.textContent = texto;
    mensajeDiv.className = `mensaje ${tipo}`;
    mensajeDiv.style.display = 'block';

    // ocultar después de 5 segundos
    setTimeout(() => {
        mensajeDiv.style.display = 'none';
    }, 5000);
}

// FUNCIÓN PARA VALIDAR EL EMAIL
function esEmailValido(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// FUNCIÓN PARA VALIDAR EL TELÉFONO (SOLO NÚMEROS, MÍNIMO 7 DÍGITOS)
function esTelefonoValido(telefono) {
    const soloNumeros = /^[0-9]+$/.test(telefono);
    return soloNumeros && telefono.length >= 7;
}

// FUNCIÓN PARA VALIDAR EL FORMULARIO
function validarFormulario(datos) {
    // VALIDAR NOMBRE
    if (!datos.nombre_cliente || datos.nombre_cliente.trim().length < 3) {
        mostrarMensaje('El nombre debe tener al menos 3 caracteres.', 'error');
        return false;
    }

    // VALIDAR EMAIL
    if (!datos.email || !esEmailValido(datos.email)) {
        mostrarMensaje('Ingresá un email válido (ej: usuario@dominio.com).', 'error');
        return false;
    }

    // VALIDAR TELÉFONO (SI SE INGRESÓ, QUE SEA VÁLIDO)
    if (datos.telefono && datos.telefono.trim() !== '') {
        if (!esTelefonoValido(datos.telefono)) {
            mostrarMensaje('El teléfono debe contener solo números y tener al menos 7 dígitos.', 'error');
            return false;
        }
    }

    // VALIDAR MODELO DEL CELULAR
    if (!datos.modelo_celular || datos.modelo_celular.trim().length < 2) {
        mostrarMensaje('Ingresá el modelo del celular.', 'error');
        return false;
    }

    // VALIDAR DESCRIPCIÓN DEL PROBLEMA
    if (!datos.descripcion_problema || datos.descripcion_problema.trim().length < 10) {
        mostrarMensaje('La descripción debe tener al menos 10 caracteres.', 'error');
        return false;
    }

    // todas las validaciones pasaron
    return true;
}

// EVENTO SUBMIT DEL FORMULARIO
form.addEventListener('submit', async (e) => {
    e.preventDefault(); // evita que recargue la página

    // obtener datos del formulario
    const datos = {
        nombre_cliente: document.getElementById('nombre_cliente').value.trim(),
        email: document.getElementById('email').value.trim(),
        telefono: document.getElementById('telefono').value.trim(),
        modelo_celular: document.getElementById('modelo_celular').value.trim(),
        descripcion_problema: document.getElementById('descripcion_problema').value.trim()
    };

    // validar los datos antes de enviar
    if (!validarFormulario(datos)) {
        return; // si hay error, no enviamos
    }

    // deshabilitar el botón mientras se envía
    const boton = form.querySelector('button[type="submit"]');
    boton.disabled = true;
    boton.textContent = 'Enviando...';

    try {
        const respuesta = await fetch('/api/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            mostrarMensaje('¡Pedido enviado con éxito!', 'exito');
            form.reset(); // limpia el formulario
        } else {
            mostrarMensaje(`Error: ${resultado.error}`, 'error');
        }
    } catch (error) {
        mostrarMensaje('No se pudo conectar con el servidor. Asegurate de que esté corriendo (npm run dev)', 'error');
        console.error('Error de conexión:', error);
    } finally {
        // rehabilitar el botón
        boton.disabled = false;
        boton.textContent = 'Enviar pedido';
    }
});

// VALIDACIONES EN TIEMPO REAL (MIENTRAS EL USUARIO ESCRIBE)
// opcional: cambiar el borde del campo si es inválido

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