// LOGICA DE LA PAGINA "MI PERFIL" - DUOTECHBROS ADMIN

const API_ADMIN_PERFIL = '/api/admin/perfil';

const tabs = document.querySelectorAll('.perfil-tab');
const secciones = {
    info: document.getElementById('seccion-info'),
    usuario: document.getElementById('seccion-usuario'),
    password: document.getElementById('seccion-password'),
};

const infoUsuario = document.getElementById('info-usuario');

const formUsuario = document.getElementById('form-usuario');
const btnCambiarUsuario = document.getElementById('btn-cambiar-usuario');
const mensajeUsuario = document.getElementById('mensaje-usuario');
const inputUsuarioNuevo = document.getElementById('usuario-nuevo');
const inputUsuarioPassword = document.getElementById('usuario-password');

const formPassword = document.getElementById('form-password');
const btnCambiarPassword = document.getElementById('btn-cambiar-password');
const mensajePassword = document.getElementById('mensaje-password');

function mostrarMensaje(elemento, texto, tipo) {
    elemento.textContent = texto;
    elemento.className = `perfil-mensaje perfil-mensaje-${tipo}`;
}

function limpiarMensaje(elemento) {
    elemento.textContent = '';
    elemento.className = 'perfil-mensaje';
}

function activarTab(nombre) {
    tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === nombre));
    Object.entries(secciones).forEach(([clave, seccion]) => {
        seccion.style.display = clave === nombre ? 'block' : 'none';
    });
    limpiarMensaje(mensajeUsuario);
    limpiarMensaje(mensajePassword);
}

tabs.forEach((tab) => {
    tab.addEventListener('click', () => activarTab(tab.dataset.tab));
});

async function cargarPerfil() {
    try {
        const respuesta = await fetchAdmin(API_ADMIN_PERFIL);
        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

        const data = await respuesta.json();
        if (data.success && data.admin) {
            infoUsuario.textContent = data.admin.usuario || '—';
            inputUsuarioNuevo.value = data.admin.usuario || '';
        }
    } catch (error) {
        console.error('Error al cargar perfil:', error);
    }
}

formUsuario.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuarioNuevo = inputUsuarioNuevo.value.trim();
    const password = inputUsuarioPassword.value;

    if (!usuarioNuevo || !password) {
        mostrarMensaje(mensajeUsuario, 'Completa todos los campos.', 'error');
        return;
    }

    if (usuarioNuevo.length < 3 || usuarioNuevo.length > 30) {
        mostrarMensaje(mensajeUsuario, 'El usuario debe tener entre 3 y 30 caracteres.', 'error');
        return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(usuarioNuevo)) {
        mostrarMensaje(
            mensajeUsuario,
            'El usuario solo puede contener letras, números y guión bajo.',
            'error'
        );
        return;
    }

    btnCambiarUsuario.disabled = true;
    btnCambiarUsuario.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    if (window.pausarNotificaciones) window.pausarNotificaciones();

    try {
        const respuesta = await fetchAdmin(`${API_ADMIN_PERFIL}/usuario`, {
            method: 'PUT',
            body: JSON.stringify({ usuario_nuevo: usuarioNuevo, password }),
        });
        const resultado = await respuesta.json();

        if (resultado.success) {
            mostrarMensaje(mensajeUsuario, 'Usuario actualizado correctamente.', 'exito');
            sessionStorage.setItem('adminUsuario', resultado.usuario);
            sessionStorage.setItem('adminToken', resultado.token);

            const nombreSidebar = document.getElementById('nombre-usuario');
            if (nombreSidebar) nombreSidebar.textContent = resultado.usuario;

            infoUsuario.textContent = resultado.usuario;
            inputUsuarioPassword.value = '';
            setTimeout(() => window.location.reload(), 1200);
        } else {
            mostrarMensaje(mensajeUsuario, resultado.error || 'No se pudo actualizar.', 'error');
        }
    } catch (error) {
        console.error('Error al cambiar usuario:', error);
        mostrarMensaje(mensajeUsuario, 'No se pudo conectar con el servidor.', 'error');
    } finally {
        btnCambiarUsuario.disabled = false;
        btnCambiarUsuario.innerHTML = '<i class="fas fa-save"></i> Guardar nuevo usuario';
    }
});

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
        mostrarMensaje(
            mensajePassword,
            'La nueva contraseña debe tener al menos 6 caracteres.',
            'error'
        );
        return;
    }

    if (passwordNueva !== passwordConfirmar) {
        mostrarMensaje(mensajePassword, 'Las contraseñas nuevas no coinciden.', 'error');
        return;
    }

    if (passwordNueva === passwordActual) {
        mostrarMensaje(mensajePassword, 'La nueva contraseña debe ser distinta a la actual.', 'error');
        return;
    }

    btnCambiarPassword.disabled = true;
    btnCambiarPassword.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    if (window.pausarNotificaciones) window.pausarNotificaciones();

    try {
        const respuesta = await fetchAdmin(`${API_ADMIN_PERFIL}/password`, {
            method: 'PUT',
            body: JSON.stringify({
                password_actual: passwordActual,
                password_nueva: passwordNueva,
                password_confirmar: passwordConfirmar,
            }),
        });
        const resultado = await respuesta.json();

        if (resultado.success) {
            mostrarMensaje(mensajePassword, 'Contraseña actualizada correctamente.', 'exito');
            if (resultado.token) {
                sessionStorage.setItem('adminToken', resultado.token);
            }
            formPassword.reset();
        } else {
            mostrarMensaje(mensajePassword, resultado.error || 'No se pudo actualizar.', 'error');
        }
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        mostrarMensaje(mensajePassword, 'No se pudo conectar con el servidor.', 'error');
    } finally {
        btnCambiarPassword.disabled = false;
        btnCambiarPassword.innerHTML = '<i class="fas fa-save"></i> Guardar nueva contraseña';
    }
});

document.addEventListener('DOMContentLoaded', cargarPerfil);
