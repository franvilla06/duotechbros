// REQUIERE ESTAR LOGUEADO PARA ENVIAR
// carga los datos de contacto y horarios desde la configuracion del sitio

const API_CONFIG_PEDIDOS = '/api/configuracion';

const form = document.getElementById('form-pedido');
const mensajeDiv = document.getElementById('mensaje');
const btnEnviar = document.getElementById('btn-enviar');

const STORAGE_KEY = 'pedidoBorrador';

// UTILIDADES DE SESION

// indica si hay una sesi?n de usuario activa.
function estaLogueadoUsuario() {
    return (
        sessionStorage.getItem('usuarioLogueado') === 'true' &&
        !!sessionStorage.getItem('usuarioToken')
    );
}

// obtiene el token de autenticaci?n del usuario.
function obtenerTokenUsuario() {
    return sessionStorage.getItem('usuarioToken') || '';
}

// UTILIDADES GENERALES

// escapa el texto para insertarlo de forma segura en HTML.
function escapar(texto) {
    if (texto === null || texto === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(texto);
    return div.innerHTML;
}

// muestra un mensaje de estado en el elemento indicado.
function mostrarMensaje(texto, tipo) {
    mensajeDiv.textContent = texto;
    mensajeDiv.className = `mensaje ${tipo}`;
    mensajeDiv.style.display = 'block';

    setTimeout(() => {
        mensajeDiv.style.display = 'none';
    }, 5000);
}

// CARGA DE DATOS DE CONTACTO Y HORARIOS

// carga los datos de contacto y horarios desde la configuraci?n del sitio.
async function cargarDatosContacto() {
    try {
        console.log('[pedidos] Cargando configuracion del sitio...');
        const respuesta = await fetch(API_CONFIG_PEDIDOS);
        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

        const config = await respuesta.json();
        console.log('[pedidos] Configuracion recibida:', config);

        // WhatsApp
        const whatsapp = config.contacto_whatsapp || '';
        const linkWhatsapp = document.getElementById('contacto-whatsapp');
        const valorWhatsapp = document.getElementById('valor-whatsapp');
        if (whatsapp && whatsapp.trim() !== '') {
            valorWhatsapp.textContent = whatsapp;
            const soloNumeros = whatsapp.replace(/[^\d]/g, '');
            linkWhatsapp.href = `https://wa.me/${soloNumeros}`;
            linkWhatsapp.target = '_blank';
            linkWhatsapp.rel = 'noopener noreferrer';
        } else {
            valorWhatsapp.textContent = 'No disponible';
            linkWhatsapp.style.opacity = '0.5';
            linkWhatsapp.style.pointerEvents = 'none';
        }

        // EMAIL
        const email = config.contacto_email || '';
        const linkEmail = document.getElementById('contacto-email');
        const valorEmail = document.getElementById('valor-email');
        if (email && email.trim() !== '') {
            valorEmail.textContent = email;
            linkEmail.href = `mailto:${email}`;
        } else {
            valorEmail.textContent = 'No disponible';
            linkEmail.style.opacity = '0.5';
            linkEmail.style.pointerEvents = 'none';
        }

        // HORARIOS
        const horarioSemana = config.horario_semana || 'No disponible';
        const horarioSabado = config.horario_sabado || 'No disponible';
        const horarioDomingo = config.horario_domingo || 'No disponible';

        document.getElementById('valor-horario-semana').textContent = horarioSemana;
        document.getElementById('valor-horario-sabado').textContent = horarioSabado;
        document.getElementById('valor-horario-domingo').textContent = horarioDomingo;
    } catch (error) {
        console.warn('No se pudo cargar la configuracion del sitio:', error.message);
        document.getElementById('valor-whatsapp').textContent = 'No disponible';
        document.getElementById('valor-email').textContent = 'No disponible';
        document.getElementById('valor-horario-semana').textContent = 'No disponible';
        document.getElementById('valor-horario-sabado').textContent = 'No disponible';
        document.getElementById('valor-horario-domingo').textContent = 'No disponible';
    }
}

// VALIDACIONES

// indica si el correo electr?nico tiene un formato v?lido.
function esEmailValido(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// indica si el tel?fono contiene suficientes d?gitos.
function esTelefonoValido(telefono) {
    const soloNumeros = /^[0-9]+$/.test(telefono);
    return soloNumeros && telefono.length >= 7;
}

// valida los datos ingresados antes de enviar el formulario.
function validarFormulario(datos) {
    if (!datos.nombre_cliente || datos.nombre_cliente.trim().length < 3) {
        mostrarMensaje('El nombre debe tener al menos 3 caracteres.', 'error');
        return false;
    }

    if (!datos.email || !esEmailValido(datos.email)) {
        mostrarMensaje('Ingresá un email válido (ej: usuario@dominio.com).', 'error');
        return false;
    }

    if (datos.telefono && datos.telefono.trim() !== '') {
        if (!esTelefonoValido(datos.telefono)) {
            mostrarMensaje(
                'El teléfono debe contener solo números y tener al menos 7 dígitos.',
                'error'
            );
            return false;
        }
    }

    if (!datos.modelo_celular || datos.modelo_celular.trim().length < 2) {
        mostrarMensaje('Ingresá el modelo del celular.', 'error');
        return false;
    }

    if (!datos.descripcion_problema || datos.descripcion_problema.trim().length < 10) {
        mostrarMensaje('La descripción debe tener al menos 10 caracteres.', 'error');
        return false;
    }

    return true;
}

// GUARDAR / RESTAURAR BORRADOR

// guarda los datos del formulario para recuperarlos m?s tarde.
function guardarBorrador(datos) {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
    } catch (error) {
        console.warn('No se pudo guardar el borrador:', error.message);
    }
}

// recupera los datos del formulario guardados anteriormente.
function restaurarBorrador() {
    try {
        const guardado = sessionStorage.getItem(STORAGE_KEY);
        if (!guardado) return;

        const datos = JSON.parse(guardado);
        if (datos.nombre_cliente) document.getElementById('nombre_cliente').value = datos.nombre_cliente;
        if (datos.email) document.getElementById('email').value = datos.email;
        if (datos.telefono) document.getElementById('telefono').value = datos.telefono;
        if (datos.modelo_celular) document.getElementById('modelo_celular').value = datos.modelo_celular;
        if (datos.descripcion_problema)
            document.getElementById('descripcion_problema').value = datos.descripcion_problema;

        mostrarMensaje('Se restauraron los datos que habías cargado antes de iniciar sesión.', 'exito');

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

        mostrarMensaje('Necesitas iniciar sesión para enviar el pedido. Redirigiendo...', 'error');

        setTimeout(() => {
            window.location.href = '/user/login.html?redirect=/pedidos.html';
        }, 1500);
        return;
    }

    btnEnviar.disabled = true;
    btnEnviar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

    try {
        const respuesta = await fetch('/api/pedidos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${obtenerTokenUsuario()}`,
            },
            body: JSON.stringify(datos),
        });

        if (respuesta.status === 401) {
            sessionStorage.removeItem('usuarioLogueado');
            sessionStorage.removeItem('usuarioNombre');
            sessionStorage.removeItem('usuarioToken');
            mostrarMensaje('Tu sesión expiró. Redirigiendo al login...', 'error');
            setTimeout(() => {
                window.location.href = '/user/login.html?redirect=/pedidos.html';
            }, 1500);
            return;
        }

        const resultado = await respuesta.json();

        if (resultado.success) {
            mostrarMensaje('¡Pedido enviado con éxito! Te vamos a contactar a la brevedad.', 'exito');
            form.reset();
        } else {
            mostrarMensaje(`Error: ${resultado.error}`, 'error');
        }
    } catch (error) {
        mostrarMensaje(
            'No se pudo conectar con el servidor. Asegurate de que esté corriendo.',
            'error'
        );
        console.error('Error de conexión:', error);
    } finally {
        btnEnviar.disabled = false;
        btnEnviar.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar pedido';
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
    // mostrar el aviso si el usuario no esta logueado
    if (!estaLogueadoUsuario()) {
        const aviso = document.getElementById('aviso-login');
        if (aviso) aviso.style.display = 'flex';
    }

    // cargar los datos de contacto y horarios desde la configuracion
    cargarDatosContacto();

    // RESTAURAR EL BORRADOR SI VENIMOS DE UN LOGIN
    restaurarBorrador();
});