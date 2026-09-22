// LÓGICA COMÚN DEL PANEL DE ADMINISTRACIÓN

const API_BASE = '/api';

// UTILIDADES DE SESIÓN

function guardarSesion(usuario, token) {
    sessionStorage.setItem('adminLogueado', 'true');
    sessionStorage.setItem('adminUsuario', usuario);
    sessionStorage.setItem('adminToken', token);
}

function estaLogueado() {
    return sessionStorage.getItem('adminLogueado') === 'true' && !!sessionStorage.getItem('adminToken');
}

function obtenerUsuario() {
    return sessionStorage.getItem('adminUsuario') || 'Admin';
}

function obtenerToken() {
    return sessionStorage.getItem('adminToken') || '';
}

function cerrarSesion() {
    sessionStorage.removeItem('adminLogueado');
    sessionStorage.removeItem('adminUsuario');
    sessionStorage.removeItem('adminToken');
    window.location.href = '/admin/login.html';
}

/**
 * fetch con autenticación: agrega automáticamente el header Authorization.
 */
async function fetchAdmin(url, opciones = {}) {
    const token = obtenerToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(opciones.headers || {}),
        Authorization: `Bearer ${token}`,
    };

    const respuesta = await fetch(url, { ...opciones, headers });

    if (respuesta.status === 401) {
        alert('Tu sesión expiró. Volvé a iniciar sesión.');
        cerrarSesion();
        throw new Error('No autorizado');
    }

    return respuesta;
}

/** 
 * Protege una página del panel.
 * Si no hay sesión activa, redirige al login.
 * También coloca el nombre del usuario en el sidebar y configura el logout.
 */
function protegerPagina() {
    if (!estaLogueado()) {
        window.location.href = '/admin/login.html';
        return;
    }

    const nombreUsuario = document.getElementById('nombre-usuario');
    if (nombreUsuario) {
        nombreUsuario.textContent = obtenerUsuario();
    }

    const botonLogout = document.getElementById('logout-btn');
    if (botonLogout) {
        botonLogout.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que querés cerrar sesión?')) {
                cerrarSesion();
            }
        });
    }
}

// LÓGICA DE LOGIN

const formLogin = document.getElementById('form-login');

if (formLogin) {
    const mensajeDiv = document.getElementById('login-mensaje');
    const boton = formLogin.querySelector('button[type="submit"]');

    // Si ya está logueado, redirige directo al dashboard
    if (estaLogueado()) {
        window.location.href = '/admin/dashboard.html';
    }

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();

        const usuario = document.getElementById('usuario').value.trim();
        const password = document.getElementById('password').value;

        if (!usuario || !password) {
            mostrarMensajeLogin('Por favor, completá todos los campos.', 'error');
            return;
        }

        boton.disabled = true;
        boton.textContent = 'Verificando...';

        try {
            const respuesta = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario, password }),
            });

            const resultado = await respuesta.json();

            if (resultado.success) {
                guardarSesion(resultado.usuario, resultado.token);
                mostrarMensajeLogin('Acceso correcto. Redirigiendo...', 'exito');
                setTimeout(() => {
                    window.location.href = '/admin/dashboard.html';
                }, 800);
            } else {
                mostrarMensajeLogin(
                    `${resultado.error || 'Usuario o contraseña incorrectos.'}`,
                    'error'
                );
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            mostrarMensajeLogin(
                'No se pudo conectar con el servidor. Verificá que esté corriendo.',
                'error'
            );
        } finally {
            boton.disabled = false;
            boton.textContent = 'Iniciar Sesión';
        }
    });

    function mostrarMensajeLogin(texto, tipo) {
        mensajeDiv.textContent = texto;
        mensajeDiv.className = `login-mensaje ${tipo}`;
    }
}

// PROTECCIÓN AUTOMÁTICA DE PÁGINAS INTERNAS

document.addEventListener('DOMContentLoaded', () => {
    if (document.body.dataset.adminProtected === 'true') {
        protegerPagina();
    }
});