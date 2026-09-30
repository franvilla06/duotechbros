// LOGICA DE LA PAGINA DE LOGIN Y REGISTRO DE USUARIOS

const API_USUARIOS = '/api/usuarios';

// referencias a los elementos del dom
const tabs = document.querySelectorAll('.usuario-tab');
const formLogin = document.getElementById('form-login');
const formRegistro = document.getElementById('form-registro');
const mensajeDiv = document.getElementById('mensaje');
const btnLogin = document.getElementById('btn-login');
const btnRegistro = document.getElementById('btn-registro');

// UTILIDADES DE SESION

// guardar la sesion del usuario en sessionStorage
function guardarSesionUsuario(usuario, token) {
    sessionStorage.setItem('usuarioLogueado', 'true');
    sessionStorage.setItem('usuarioNombre', usuario);
    sessionStorage.setItem('usuarioToken', token);
}

// verificar si hay una sesion activa
function estaLogueadoUsuario() {
    return (
        sessionStorage.getItem('usuarioLogueado') === 'true' &&
        !!sessionStorage.getItem('usuarioToken')
    );
}

// MENSAJES

function mostrarMensaje(texto, tipo) {
    mensajeDiv.textContent = texto;
    mensajeDiv.className = `usuario-mensaje ${tipo}`;
}

function limpiarMensaje() {
    mensajeDiv.textContent = '';
    mensajeDiv.className = 'usuario-mensaje';
}

// TABS

function activarTab(nombreTab) {
    tabs.forEach((tab) => {
        tab.classList.toggle('active', tab.dataset.tab === nombreTab);
    });

    if (nombreTab === 'login') {
        formLogin.style.display = 'flex';
        formRegistro.style.display = 'none';
    } else {
        formLogin.style.display = 'none';
        formRegistro.style.display = 'flex';
    }

    limpiarMensaje();
}

tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
        activarTab(tab.dataset.tab);
    });
});

// VALIDACIONES EN EL FRONTEND

function validarUsuarioFrontend(usuario) {
    if (!usuario || usuario.length < 3) {
        return 'El nombre de usuario debe tener al menos 3 caracteres.';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(usuario)) {
        return 'El nombre de usuario solo puede contener letras, numeros y guion bajo.';
    }
    return null;
}

// LOGIN

formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuario = document.getElementById('login-usuario').value.trim();
    const password = document.getElementById('login-password').value;

    if (!usuario || !password) {
        mostrarMensaje('Completa todos los campos.', 'error');
        return;
    }

    btnLogin.disabled = true;
    btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ingresando...';

    try {
        const respuesta = await fetch(`${API_USUARIOS}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, password }),
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            guardarSesionUsuario(resultado.usuario, resultado.token);
            mostrarMensaje('Acceso correcto. Redirigiendo...', 'exito');
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 800);
        } else {
            mostrarMensaje(resultado.error || 'Usuario o contrasenia incorrectos.', 'error');
        }
    } catch (error) {
        console.error('Error de conexion:', error);
        mostrarMensaje('No se pudo conectar con el servidor.', 'error');
    } finally {
        btnLogin.disabled = false;
        btnLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i> Ingresar';
    }
});

// REGISTRO

formRegistro.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuario = document.getElementById('registro-usuario').value.trim();
    const password = document.getElementById('registro-password').value;
    const passwordConfirm = document.getElementById('registro-password-confirm').value;

    // validar el usuario
    const errorUsuario = validarUsuarioFrontend(usuario);
    if (errorUsuario) {
        mostrarMensaje(errorUsuario, 'error');
        return;
    }

    // validar la contrasenia
    if (!password || password.length < 6) {
        mostrarMensaje('La contrasenia debe tener al menos 6 caracteres.', 'error');
        return;
    }

    // verificar que las contrasenias coincidan
    if (password !== passwordConfirm) {
        mostrarMensaje('Las contrasenias no coinciden.', 'error');
        return;
    }

    btnRegistro.disabled = true;
    btnRegistro.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando cuenta...';

    try {
        const respuesta = await fetch(`${API_USUARIOS}/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, password }),
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            guardarSesionUsuario(resultado.usuario, resultado.token);
            mostrarMensaje('Cuenta creada correctamente. Redirigiendo...', 'exito');
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 1000);
        } else {
            mostrarMensaje(resultado.error || 'No se pudo crear la cuenta.', 'error');
        }
    } catch (error) {
        console.error('Error de conexion:', error);
        mostrarMensaje('No se pudo conectar con el servidor.', 'error');
    } finally {
        btnRegistro.disabled = false;
        btnRegistro.innerHTML = '<i class="fas fa-user-plus"></i> Crear cuenta';
    }
});

// INICIO

document.addEventListener('DOMContentLoaded', () => {
    // si el usuario ya esta logueado, redirigir al inicio
    if (estaLogueadoUsuario()) {
        window.location.href = '/index.html';
    }
});