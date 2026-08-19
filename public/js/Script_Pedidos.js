const form = document.getElementById('form-pedido');
const mensajeDiv = document.getElementById('mensaje');

// Función para mostrar mensajes
function mostrarMensaje(texto, tipo) {
    mensajeDiv.textContent = texto;
    mensajeDiv.className = `mensaje ${tipo}`;
    mensajeDiv.style.display = 'block';

    // Ocultar después de 5 segundos
    setTimeout(() => {
        mensajeDiv.style.display = 'none';
    }, 5000);
}

// Función para validar el email
function esEmailValido(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Función para validar el teléfono (solo números, mínimo 7 dígitos)
function esTelefonoValido(telefono) {
    const soloNumeros = /^[0-9]+$/.test(telefono);
    return soloNumeros && telefono.length >= 7;
}

// Función para validar el formulario
function validarFormulario(datos) {
    // Validar nombre
    if (!datos.nombre_cliente || datos.nombre_cliente.trim().length < 3) {
        mostrarMensaje('❌ El nombre debe tener al menos 3 caracteres.', 'error');
        return false;
    }

    // Validar email
    if (!datos.email || !esEmailValido(datos.email)) {
        mostrarMensaje('❌ Ingresá un email válido (ej: usuario@dominio.com).', 'error');
        return false;
    }

    // Validar teléfono (si se ingresó, que sea válido)
    if (datos.telefono && datos.telefono.trim() !== '') {
        if (!esTelefonoValido(datos.telefono)) {
            mostrarMensaje('❌ El teléfono debe contener solo números y tener al menos 7 dígitos.', 'error');
            return false;
        }
    }

    // Validar modelo del celular
    if (!datos.modelo_celular || datos.modelo_celular.trim().length < 2) {
        mostrarMensaje('❌ Ingresá el modelo del celular.', 'error');
        return false;
    }

    // Validar descripción del problema
    if (!datos.descripcion_problema || datos.descripcion_problema.trim().length < 10) {
        mostrarMensaje('❌ La descripción debe tener al menos 10 caracteres.', 'error');
        return false;
    }

    // Todas las validaciones pasaron
    return true;
}

// Evento submit del formulario
form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita que recargue la página

    // Obtener datos del formulario
    const datos = {
        nombre_cliente: document.getElementById('nombre_cliente').value.trim(),
        email: document.getElementById('email').value.trim(),
        telefono: document.getElementById('telefono').value.trim(),
        modelo_celular: document.getElementById('modelo_celular').value.trim(),
        descripcion_problema: document.getElementById('descripcion_problema').value.trim()
    };

    // Validar los datos antes de enviar
    if (!validarFormulario(datos)) {
        return; // Si hay error, no enviamos
    }

    // Deshabilitar el botón mientras se envía
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
            mostrarMensaje('✅ ¡Pedido enviado con éxito!', 'exito');
            form.reset(); // Limpia el formulario
        } else {
            mostrarMensaje(`❌ Error: ${resultado.error}`, 'error');
        }
    } catch (error) {
        mostrarMensaje('❌ No se pudo conectar con el servidor. Asegurate de que esté corriendo (npm run dev)', 'error');
        console.error('Error de conexión:', error);
    } finally {
        // Rehabilitar el botón
        boton.disabled = false;
        boton.textContent = 'Enviar pedido';
    }
});

// Validaciones en tiempo real (mientras el usuario escribe)
// Opcional: cambiar el borde del campo si es inválido

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