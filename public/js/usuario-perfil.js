// LOGICA DE LA PAGINA DE PERFIL DEL USUARIO

const API_PERFIL = '/api/usuarios/perfil';

// referencias a los elementos del dom
const usuarioSpan = document.getElementById('perfil-usuario');
const tabs = document.querySelectorAll('.perfil-tab');
const secciones = {
    info: document.getElementById('seccion-info'),
    password: document.getElementById('seccion-password'),
    baja: document.getElementById('seccion-baja'),
};

// info del perfil
const infoUsuario = document.getElementById('info-usuario');
const infoCreado = document.getElementById('info-creado');
const infoId = document.getElementById('info-id');

// form de cambio de contrasenia
const formPassword = document.getElementById('form-password');
const btnCambiar = document.getElementById('btn-cambiar');
const mensajePassword = document.getElementById('mensaje-password');

// form de baja
const formBaja = document.getElementById('form-baja');
const btnBaja = document.getElementById('btn-baja');
const mensajeBaja = document.getElementById('mensaje-baja');

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

function formatearFecha(fechaISO) {
    if (!fechaISO) return '—';
    const fecha = new Date(fechaISO.replace(' ', 'T'));
    if (isNaN(fecha)) return fechaISO;

    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
}

function mostrarMensaje(elemento, texto, tipo) {
    elemento.textContent = texto;
    elemento.className = `perfil-mensaje perfil-mensaje-${tipo}`;
}

function limpiarMensaje(elemento) {
    elemento.textContent = '';
    elemento.className = 'perfil-mensaje';
}

// TABS

function activarTab(nombreTab) {
    tabs.forEach((tab) => {
        tab.classList.toggle('active', tab.dataset.tab === nombreTab);
    });

    Object.entries(secciones).forEach(([clave, seccion]) => {
        seccion.style.display = clave === nombreTab ? 'block' : 'none';
    });

    limpiarMensaje(mensajePassword);
    limpiarMensaje(mensajeBaja);
}

tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
        activarTab(tab.dataset.tab);
    });
});

// CARGAR PERFIL

async function cargarPerfil() {
    try {
        const respuesta = await fetch(API_PERFIL, {
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

        infoUsuario.textContent = data.usuario || '—';
        infoCreado.textContent = formatearFecha(data.creado_en);
        infoId.textContent = `#${String(data.id).padStart(4, '0')}`;
    } catch (error) {
        console.error('Error al cargar perfil:', error);
        infoUsuario.textContent = 'No se pudo cargar';
        infoCreado.textContent = '—';
        infoId.textContent = '—';
    }
}

// CAMBIAR CONTRASENIA

formPassword.addEventListener('submit', async (e) => {
    e.preventDefault();

    const passwordActual = document.getElementById('password-actual').value;
    const passwordNueva = document.getElementById('password-nueva').value;
    const passwordConfirmar = document.getElementById('password-confirmar').value;

    if (!passwordActual || !passwordNueva || !passwordConfirmar) {
        mostrarMensaje(mensajePassword, 'Completa todos los campos.', 'error');
        return;
    }

    if (passwordNueva.length < 6) {
        mostrarMensaje(mensajePassword, 'La nueva contrasenia debe tener al menos 6 caracteres.', 'error');
        return;
    }

    if (passwordNueva !== passwordConfirmar) {
        mostrarMensaje(mensajePassword, 'Las contrasenias nuevas no coinciden.', 'error');
        return;
    }

    if (passwordNueva === passwordActual) {
        mostrarMensaje(mensajePassword, 'La nueva contrasenia debe ser distinta a la actual.', 'error');
        return;
    }

    btnCambiar.disabled = true;
    btnCambiar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    try {
        const respuesta = await fetch(`${API_PERFIL}/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${obtenerTokenUsuario()}`,
            },
            body: JSON.stringify({
                password_actual: passwordActual,
                password_nueva: passwordNueva,
                password_confirmar: passwordConfirmar,
            }),
        });

        const resultado = await respuesta.json();

        if (respuesta.status === 401) {
            cerrarSesionUsuario();
            window.location.href = '/user/login.html';
            return;
        }

        if (resultado.success) {
            mostrarMensaje(mensajePassword, 'Contrasenia actualizada correctamente.', 'exito');
            formPassword.reset();
        } else {
            mostrarMensaje(mensajePassword, resultado.error || 'No se pudo cambiar la contrasenia.', 'error');
        }
    } catch (error) {
        console.error('Error al cambiar contrasenia:', error);
        mostrarMensaje(mensajePassword, 'No se pudo conectar con el servidor.', 'error');
    } finally {
        btnCambiar.disabled = false;
        btnCambiar.innerHTML = '<i class="fas fa-save"></i> Guardar cambios';
    }
});

// DAR DE BAJA

formBaja.addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = document.getElementById('baja-password').value;

    if (!password) {
        mostrarMensaje(mensajeBaja, 'Ingresa tu contrasenia para confirmar.', 'error');
        return;
    }

    const confirmacion = confirm(
        'ATENCION: Esta accion es irreversible.\n\n' +
            'Se va a eliminar tu cuenta de forma permanente. No vas a poder ' +
            'volver a iniciar sesion con este usuario.\n\n' +
            'Queres continuar?'
    );

    if (!confirmacion) return;

    btnBaja.disabled = true;
    btnBaja.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

    try {
        const respuesta = await fetch(API_PERFIL, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${obtenerTokenUsuario()}`,
            },
            body: JSON.stringify({ password }),
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            mostrarMensaje(mensajeBaja, 'Cuenta eliminada correctamente. Redirigiendo...', 'exito');

            // limpiar sesion despues de un momento para que se vea el mensaje
            setTimeout(() => {
                cerrarSesionUsuario();
                window.location.href = '/index.html';
            }, 1500);
        } else {
            mostrarMensaje(mensajeBaja, resultado.error || 'No se pudo eliminar la cuenta.', 'error');
            btnBaja.disabled = false;
            btnBaja.innerHTML = '<i class="fas fa-user-times"></i> Dar de baja mi cuenta';
        }
    } catch (error) {
        console.error('Error al dar de baja:', error);
        mostrarMensaje(mensajeBaja, 'No se pudo conectar con el servidor.', 'error');
        btnBaja.disabled = false;
        btnBaja.innerHTML = '<i class="fas fa-user-times"></i> Dar de baja mi cuenta';
    }
});

// INICIO

document.addEventListener('DOMContentLoaded', () => {
    if (!estaLogueadoUsuario()) {
        window.location.href = '/user/login.html';
        return;
    }

    if (usuarioSpan) {
        usuarioSpan.innerHTML = `<i class="fas fa-user-circle"></i> ${obtenerUsuarioActual()}`;
    }

    cargarPerfil();
});