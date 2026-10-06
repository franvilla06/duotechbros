// LOGICA DE LA PAGINA DE LOGIN Y REGISTRO DE USUARIOS
// incluye el flujo de verificacion por email en dos pasos

const API_USUARIOS = '/api/usuarios';

// referencias a los elementos del dom
const tabs = document.querySelectorAll('.usuario-tab');
const tabsContainer = document.getElementById('usuario-tabs');
const pasosContainer = document.getElementById('registro-pasos');
const pasos = document.querySelectorAll('.registro-paso');

const formLogin = document.getElementById('form-login');
const formRegistro = document.getElementById('form-registro');
const vistaVerificacion = document.getElementById('vista-verificacion');

const mensajeDiv = document.getElementById('mensaje');
const btnLogin = document.getElementById('btn-login');
const btnRegistro = document.getElementById('btn-registro');
const btnVerificar = document.getElementById('btn-verificar');
const btnReenviar = document.getElementById('btn-reenviar');
const btnVolver = document.getElementById('btn-volver');

const inputCodigo = document.getElementById('verificacion-codigo');
const textoEmail = document.getElementById('verificacion-email');

// guardamos el email que estamos verificando
let emailEnVerificacion = '';

// REDIRECCION POST LOGIN

function obtenerUrlRedireccion() {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');

    // validar que sea una url interna (empieza con /)
    if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
        return redirect;
    }
    return '/index.html';
}

// UTILIDADES DE SESION

function guardarSesionUsuario(usuario, token) {
    sessionStorage.setItem('usuarioLogueado', 'true');
    sessionStorage.setItem('usuarioNombre', usuario);
    sessionStorage.setItem('usuarioToken', token);
}

function estaLogueadoUsuario() {
    return (
        sessionStorage.getItem('usuarioLogueado') === 'true' &&
        !!sessionStorage.getItem('usuarioToken')
    );
}

function cerrarSesionUsuario() {
    sessionStorage.removeItem('usuarioLogueado');
    sessionStorage.removeItem('usuarioNombre');
    sessionStorage.removeItem('usuarioToken');
}

// MENSAJES

function mostrarMensaje(texto, tipo) {
    mensajeDiv.textContent = texto;
    mensajeDiv.className = `usuario-mensaje ${tipo}`;

    // autoocultar despues de 6 segundos
    setTimeout(() => {
        if (mensajeDiv.textContent === texto) {
            limpiarMensaje();
        }
    }, 6000);
}

function limpiarMensaje() {
    mensajeDiv.textContent = '';
    mensajeDiv.className = 'usuario-mensaje';
}

// VISTAS

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

    vistaVerificacion.style.display = 'none';
    limpiarMensaje();
}

// cambia la vista a la pantalla de verificacion
function mostrarVistaVerificacion(email) {
    emailEnVerificacion = email;
    textoEmail.textContent = email;

    tabsContainer.style.display = 'none';
    pasosContainer.style.display = 'flex';
    formLogin.style.display = 'none';
    formRegistro.style.display = 'none';
    vistaVerificacion.style.display = 'flex';

    // marcar el paso 2 como activo
    pasos.forEach((p) => {
        p.classList.toggle('active', p.dataset.paso === '2');
    });

    inputCodigo.value = '';
    inputCodigo.focus();
    limpiarMensaje();
}

// vuelve a la vista de registro
function volverAlRegistro() {
    tabsContainer.style.display = 'flex';
    pasosContainer.style.display = 'none';
    vistaVerificacion.style.display = 'none';
    formRegistro.style.display = 'flex';

    // reactivar el tab de registro
    tabs.forEach((tab) => {
        tab.classList.toggle('active', tab.dataset.tab === 'registro');
    });

    pasos.forEach((p) => {
        p.classList.toggle('active', p.dataset.paso === '1');
    });

    inputCodigo.value = '';
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
        return 'El nombre de usuario solo puede contener letras, números y guión bajo.';
    }
    return null;
}

function validarEmailFrontend(email) {
    if (!email) return 'El email es obligatorio.';
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) return 'El email no es válido.';
    return null;
}

// LOGIN

formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuario = document.getElementById('login-usuario').value.trim();
    const password = document.getElementById('login-password').value;

    if (!usuario || !password) {
        mostrarMensaje('Completá todos los campos.', 'error');
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
                window.location.href = obtenerUrlRedireccion();
            }, 800);
        } else {
            mostrarMensaje(resultado.error || 'Usuario o contraseña incorrectos.', 'error');
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        mostrarMensaje('No se pudo conectar con el servidor.', 'error');
    } finally {
        btnLogin.disabled = false;
        btnLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i> Ingresar';
    }
});

// REGISTRO (PASO 1: iniciar registro y enviar codigo)

formRegistro.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuario = document.getElementById('registro-usuario').value.trim();
    const email = document.getElementById('registro-email').value.trim().toLowerCase();
    const password = document.getElementById('registro-password').value;
    const passwordConfirm = document.getElementById('registro-password-confirm').value;

    // validar el usuario
    const errorUsuario = validarUsuarioFrontend(usuario);
    if (errorUsuario) {
        mostrarMensaje(errorUsuario, 'error');
        return;
    }

    // validar el email
    const errorEmail = validarEmailFrontend(email);
    if (errorEmail) {
        mostrarMensaje(errorEmail, 'error');
        return;
    }

    // validar la contrasenia
    if (!password || password.length < 6) {
        mostrarMensaje('La contraseña debe tener al menos 6 caracteres.', 'error');
        return;
    }

    // verificar que coincidan
    if (password !== passwordConfirm) {
        mostrarMensaje('Las contraseñas no coinciden.', 'error');
        return;
    }

    btnRegistro.disabled = true;
    btnRegistro.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando código...';

    try {
        const respuesta = await fetch(`${API_USUARIOS}/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, email, password }),
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            mostrarVistaVerificacion(email);
            mostrarMensaje('Código enviado. Revisá tu correo electrónico.', 'exito');
        } else {
            mostrarMensaje(resultado.error || 'No se pudo iniciar el registro.', 'error');
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        mostrarMensaje('No se pudo conectar con el servidor.', 'error');
    } finally {
        btnRegistro.disabled = false;
        btnRegistro.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar código de verificación';
    }
});

// VERIFICACION DE CODIGO (PASO 2)

// formatea el codigo: solo numeros y hasta 6 digitos
inputCodigo.addEventListener('input', (e) => {
    let valor = e.target.value.replace(/\D/g, '');
    if (valor.length > 6) valor = valor.slice(0, 6);
    e.target.value = valor;

    // si llego a 6 digitos, hacemos la verificacion automatica
    if (valor.length === 6) {
        // pequeño delay para que se vea el ultimo digito
        setTimeout(() => {
            verificarCodigo();
        }, 150);
    }
});

// permitir enviar con enter
inputCodigo.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        verificarCodigo();
    }
});

btnVerificar.addEventListener('click', verificarCodigo);

async function verificarCodigo() {
    const codigo = inputCodigo.value.trim();

    if (codigo.length !== 6) {
        mostrarMensaje('El código debe tener 6 dígitos.', 'error');
        return;
    }

    btnVerificar.disabled = true;
    btnVerificar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
    inputCodigo.disabled = true;

    try {
        const respuesta = await fetch(`${API_USUARIOS}/verificar-codigo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailEnVerificacion, codigo }),
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            guardarSesionUsuario(resultado.usuario, resultado.token);
            mostrarMensaje('Cuenta creada correctamente. Redirigiendo...', 'exito');

            setTimeout(() => {
                window.location.href = obtenerUrlRedireccion();
            }, 1000);
        } else {
            mostrarMensaje(resultado.error || 'Código incorrecto.', 'error');
            inputCodigo.disabled = false;
            inputCodigo.focus();
            inputCodigo.select();
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        mostrarMensaje('No se pudo conectar con el servidor.', 'error');
        inputCodigo.disabled = false;
    } finally {
        btnVerificar.disabled = false;
        btnVerificar.innerHTML = '<i class="fas fa-check-circle"></i> Verificar código';
    }
}

// REENVIAR CODIGO

btnReenviar.addEventListener('click', async () => {
    if (!emailEnVerificacion) {
        mostrarMensaje('No hay un email pendiente de verificación.', 'error');
        return;
    }

    btnReenviar.disabled = true;
    const contenidoOriginal = btnReenviar.innerHTML;
    btnReenviar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Reenviando...';

    try {
        const respuesta = await fetch(`${API_USUARIOS}/reenviar-codigo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailEnVerificacion }),
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            mostrarMensaje('Código reenviado. Revisá tu correo.', 'exito');
            inputCodigo.value = '';
            inputCodigo.focus();
        } else {
            mostrarMensaje(resultado.error || 'No se pudo reenviar el código.', 'error');
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        mostrarMensaje('No se pudo conectar con el servidor.', 'error');
    } finally {
        btnReenviar.disabled = false;
        btnReenviar.innerHTML = contenidoOriginal;
    }
});

// VOLVER AL REGISTRO

btnVolver.addEventListener('click', () => {
    volverAlRegistro();
});

// INICIO

document.addEventListener('DOMContentLoaded', () => {
    // si la url tiene ?logout=1, cerrar la sesion y quedarse en el login
    const params = new URLSearchParams(window.location.search);
    if (params.get('logout') === '1') {
        cerrarSesionUsuario();
        mostrarMensaje('Sesión cerrada correctamente.', 'exito');
        window.history.replaceState({}, '', '/user/login.html');
        return;
    }

    // si el usuario ya esta logueado, redirigir
    if (estaLogueadoUsuario()) {
        window.location.href = obtenerUrlRedireccion();
    }
});