// LOGICA DE LA PAGINA DE LOGIN Y REGISTRO DE USUARIOS
// login con email, registro con verificacion y recuperacion de contrasenia

const API_USUARIOS = '/api/usuarios';

// referencias a los elementos del dom
const tabs = document.querySelectorAll('.usuario-tab');
const tabsContainer = document.getElementById('usuario-tabs');
const pasosContainer = document.getElementById('registro-pasos');
const pasos = document.querySelectorAll('.registro-paso');
const paso1Label = document.getElementById('paso-1-label');
const paso2Label = document.getElementById('paso-2-label');

const formLogin = document.getElementById('form-login');
const formRegistro = document.getElementById('form-registro');
const vistaVerificacion = document.getElementById('vista-verificacion');
const vistaRecuperacionEmail = document.getElementById('vista-recuperacion-email');
const vistaRecuperacionCodigo = document.getElementById('vista-recuperacion-codigo');

const mensajeDiv = document.getElementById('mensaje');

const btnLogin = document.getElementById('btn-login');
const btnRegistro = document.getElementById('btn-registro');
const btnVerificar = document.getElementById('btn-verificar');
const btnReenviar = document.getElementById('btn-reenviar');
const btnVolver = document.getElementById('btn-volver');

const btnOlvide = document.getElementById('btn-olvide');
const btnEnviarRecuperacion = document.getElementById('btn-enviar-recuperacion');
const btnCancelarRecuperacion = document.getElementById('btn-cancelar-recuperacion');
const btnRestablecer = document.getElementById('btn-restablecer');
const btnReenviarRecuperacion = document.getElementById('btn-reenviar-recuperacion');
const btnVolverRecuperacion = document.getElementById('btn-volver-recuperacion');

const inputLoginEmail = document.getElementById('login-email');
const inputLoginPassword = document.getElementById('login-password');

const inputCodigo = document.getElementById('verificacion-codigo');
const textoEmail = document.getElementById('verificacion-email');

const inputRecuperarEmail = document.getElementById('recuperar-email');
const inputRecuperarCodigo = document.getElementById('recuperar-codigo');
const inputRecuperarPassword = document.getElementById('recuperar-password-nueva');
const inputRecuperarPasswordConfirmar = document.getElementById('recuperar-password-confirmar');
const textoRecuperarEmailMostrado = document.getElementById('recuperar-email-mostrado');

// estado local
let emailEnVerificacion = '';
let emailEnRecuperacion = '';

// REDIRECCION POST LOGIN

function obtenerUrlRedireccion() {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');

    if (redirect && redirect.startsWith('/') && !redirect.startsWith('//') && !redirect.startsWith('/\\')) {
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

// OCULTAR TODAS LAS VISTAS
function ocultarTodasLasVistas() {
    formLogin.style.display = 'none';
    formRegistro.style.display = 'none';
    vistaVerificacion.style.display = 'none';
    vistaRecuperacionEmail.style.display = 'none';
    vistaRecuperacionCodigo.style.display = 'none';
    tabsContainer.style.display = 'none';
    pasosContainer.style.display = 'none';
}

// VISTAS

function activarTab(nombreTab) {
    tabs.forEach((tab) => {
        tab.classList.toggle('active', tab.dataset.tab === nombreTab);
    });

    ocultarTodasLasVistas();
    tabsContainer.style.display = 'flex';

    if (nombreTab === 'login') {
        formLogin.style.display = 'flex';
    } else {
        formRegistro.style.display = 'flex';
    }

    limpiarMensaje();
}

function mostrarVistaVerificacion(email) {
    emailEnVerificacion = email;
    textoEmail.textContent = email;

    ocultarTodasLasVistas();
    pasosContainer.style.display = 'flex';
    vistaVerificacion.style.display = 'flex';

    paso1Label.textContent = 'Datos';
    paso2Label.textContent = 'Verificación';

    pasos.forEach((p) => {
        p.classList.toggle('active', p.dataset.paso === '2');
    });

    inputCodigo.value = '';
    inputCodigo.focus();
    limpiarMensaje();
}

function mostrarVistaRecuperacionEmail() {
    ocultarTodasLasVistas();
    pasosContainer.style.display = 'flex';
    vistaRecuperacionEmail.style.display = 'flex';

    paso1Label.textContent = 'Email';
    paso2Label.textContent = 'Código';

    pasos.forEach((p) => {
        p.classList.toggle('active', p.dataset.paso === '1');
    });

    inputRecuperarEmail.value = '';
    inputRecuperarEmail.focus();
    limpiarMensaje();
}

function mostrarVistaRecuperacionCodigo(email) {
    emailEnRecuperacion = email;
    textoRecuperarEmailMostrado.textContent = email;

    ocultarTodasLasVistas();
    pasosContainer.style.display = 'flex';
    vistaRecuperacionCodigo.style.display = 'flex';

    paso1Label.textContent = 'Email';
    paso2Label.textContent = 'Código';

    pasos.forEach((p) => {
        p.classList.toggle('active', p.dataset.paso === '2');
    });

    inputRecuperarCodigo.value = '';
    inputRecuperarPassword.value = '';
    inputRecuperarPasswordConfirmar.value = '';
    inputRecuperarCodigo.focus();
    limpiarMensaje();
}

function volverAlRegistro() {
    activarTab('registro');
    pasos.forEach((p) => {
        p.classList.toggle('active', p.dataset.paso === '1');
    });
    inputCodigo.value = '';
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

// LOGIN (con email)

formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = inputLoginEmail.value.trim().toLowerCase();
    const password = inputLoginPassword.value;

    const errorEmail = validarEmailFrontend(email);
    if (errorEmail) {
        mostrarMensaje(errorEmail, 'error');
        return;
    }

    if (!password) {
        mostrarMensaje('Ingresá tu contraseña.', 'error');
        return;
    }

    btnLogin.disabled = true;
    btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ingresando...';

    try {
        const respuesta = await fetch(`${API_USUARIOS}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            guardarSesionUsuario(resultado.usuario, resultado.token);
            mostrarMensaje('Acceso correcto. Redirigiendo...', 'exito');
            setTimeout(() => {
                window.location.href = obtenerUrlRedireccion();
            }, 800);
        } else {
            mostrarMensaje(resultado.error || 'Email o contraseña incorrectos.', 'error');
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

    const errorUsuario = validarUsuarioFrontend(usuario);
    if (errorUsuario) {
        mostrarMensaje(errorUsuario, 'error');
        return;
    }

    const errorEmail = validarEmailFrontend(email);
    if (errorEmail) {
        mostrarMensaje(errorEmail, 'error');
        return;
    }

    if (!password || password.length < 6) {
        mostrarMensaje('La contraseña debe tener al menos 6 caracteres.', 'error');
        return;
    }

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

// VERIFICACION DE CODIGO (PASO 2 DEL REGISTRO)

inputCodigo.addEventListener('input', (e) => {
    let valor = e.target.value.replace(/\D/g, '');
    if (valor.length > 6) valor = valor.slice(0, 6);
    e.target.value = valor;

    if (valor.length === 6) {
        setTimeout(() => {
            verificarCodigo();
        }, 150);
    }
});

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

// REENVIAR CODIGO (REGISTRO)

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

// ============================================================
// RECUPERACION DE CONTRASENIA
// ============================================================

btnOlvide.addEventListener('click', () => {
    mostrarVistaRecuperacionEmail();
});

btnCancelarRecuperacion.addEventListener('click', () => {
    activarTab('login');
});

btnEnviarRecuperacion.addEventListener('click', async () => {
    const email = inputRecuperarEmail.value.trim().toLowerCase();

    const errorEmail = validarEmailFrontend(email);
    if (errorEmail) {
        mostrarMensaje(errorEmail, 'error');
        return;
    }

    btnEnviarRecuperacion.disabled = true;
    btnEnviarRecuperacion.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

    try {
        const respuesta = await fetch(`${API_USUARIOS}/recuperar-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            mostrarVistaRecuperacionCodigo(email);
            mostrarMensaje('Si el email está registrado, vas a recibir un código.', 'exito');
        } else {
            mostrarMensaje(resultado.error || 'No se pudo enviar el código.', 'error');
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        mostrarMensaje('No se pudo conectar con el servidor.', 'error');
    } finally {
        btnEnviarRecuperacion.disabled = false;
        btnEnviarRecuperacion.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar código';
    }
});

inputRecuperarEmail.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        btnEnviarRecuperacion.click();
    }
});

inputRecuperarCodigo.addEventListener('input', (e) => {
    let valor = e.target.value.replace(/\D/g, '');
    if (valor.length > 6) valor = valor.slice(0, 6);
    e.target.value = valor;
});

btnRestablecer.addEventListener('click', async () => {
    const codigo = inputRecuperarCodigo.value.trim();
    const passwordNueva = inputRecuperarPassword.value;
    const passwordConfirmar = inputRecuperarPasswordConfirmar.value;

    if (!codigo || codigo.length !== 6) {
        mostrarMensaje('El código debe tener 6 dígitos.', 'error');
        return;
    }

    if (!passwordNueva || passwordNueva.length < 6) {
        mostrarMensaje('La nueva contraseña debe tener al menos 6 caracteres.', 'error');
        return;
    }

    if (passwordNueva !== passwordConfirmar) {
        mostrarMensaje('Las contraseñas no coinciden.', 'error');
        return;
    }

    btnRestablecer.disabled = true;
    btnRestablecer.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Restableciendo...';

    try {
        const respuesta = await fetch(`${API_USUARIOS}/restablecer-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: emailEnRecuperacion,
                codigo,
                password_nueva: passwordNueva,
                password_confirmar: passwordConfirmar,
            }),
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            mostrarMensaje('Contraseña restablecida. Redirigiendo al login...', 'exito');

            setTimeout(() => {
                // volver al login y autocompletar el email
                inputLoginEmail.value = emailEnRecuperacion;
                inputLoginPassword.value = '';
                activarTab('login');
                mostrarMensaje('Ya podés iniciar sesión con tu nueva contraseña.', 'exito');
                inputLoginPassword.focus();
            }, 1500);
        } else {
            mostrarMensaje(resultado.error || 'No se pudo restablecer la contraseña.', 'error');
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        mostrarMensaje('No se pudo conectar con el servidor.', 'error');
    } finally {
        btnRestablecer.disabled = false;
        btnRestablecer.innerHTML = '<i class="fas fa-check-circle"></i> Restablecer contraseña';
    }
});

inputRecuperarCodigo.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        inputRecuperarPassword.focus();
    }
});

inputRecuperarPasswordConfirmar.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        btnRestablecer.click();
    }
});

btnReenviarRecuperacion.addEventListener('click', async () => {
    if (!emailEnRecuperacion) {
        mostrarMensaje('No hay un email pendiente de recuperación.', 'error');
        return;
    }

    btnReenviarRecuperacion.disabled = true;
    const contenidoOriginal = btnReenviarRecuperacion.innerHTML;
    btnReenviarRecuperacion.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Reenviando...';

    try {
        const respuesta = await fetch(`${API_USUARIOS}/recuperar-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailEnRecuperacion }),
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            mostrarMensaje('Código reenviado. Revisá tu correo.', 'exito');
            inputRecuperarCodigo.value = '';
            inputRecuperarCodigo.focus();
        } else {
            mostrarMensaje(resultado.error || 'No se pudo reenviar el código.', 'error');
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        mostrarMensaje('No se pudo conectar con el servidor.', 'error');
    } finally {
        btnReenviarRecuperacion.disabled = false;
        btnReenviarRecuperacion.innerHTML = contenidoOriginal;
    }
});

btnVolverRecuperacion.addEventListener('click', () => {
    mostrarVistaRecuperacionEmail();
    inputRecuperarEmail.value = emailEnRecuperacion;
});

// INICIO

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('logout') === '1') {
        cerrarSesionUsuario();
        mostrarMensaje('Sesión cerrada correctamente.', 'exito');
        window.history.replaceState({}, '', '/user/login.html');
        return;
    }

    if (estaLogueadoUsuario()) {
        window.location.href = obtenerUrlRedireccion();
    }
});