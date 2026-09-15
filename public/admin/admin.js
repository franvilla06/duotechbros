// Ligica comun del panel del administrador


const API_BASE = '/api';

// utilidades de secion

function guardarSesion(usuario) {
    sessionStorage.setItem('adminLogueado', 'true');
    sessionStorage.setItem('adminUsuario', usuario);
}

function estaLogueado() {
    return sessionStorage.getItem('adminLogueado') === 'true';
}

function obtenerUsuario() {
    return sessionStorage.getItem('adminUsuario') || 'Admin';
}

function cerrarSesion() {
    sessionStorage.removeItem('adminLogueado');
    sessionStorage.removeItem('adminUsuario');
    window.location.href = '../admin/login.html';
}

/**
 * Protege una página del panel.
 * Si no hay sesión activa, redirige al login.
 * También coloca el nombre del usuario en el sidebar.
 */
function protegerPagina() {
    if (!estaLogueado()) {
        window.location.href = '../admin/login.html';
        return;
    }
    // Mostrar el nombre del usuario en el sidebar (si existe el elemento)
    const nombreUsuario = document.getElementById('nombre-usuario');
    if (nombreUsuario) {
        nombreUsuario.textContent = obtenerUsuario();
    }
    // Configurar el botón de logout
    const botonLogout = document.getElementById('logout-btn');
    if (botonLogout) {
        botonLogout.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que querés cerrar sesión?')) {
                cerrarSesion();
            }
        });
    }
}

// Logica del login

const formLogin = document.getElementById('form-login');

if (formLogin) {
    const mensajeDiv = document.getElementById('login-mensaje');
    const boton = formLogin.querySelector('button[type="submit"]');

    // Si ya está logueado, redirige directo al dashboard
    if (estaLogueado()) {
        window.location.href = '../admin/dashboard.html';
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
                guardarSesion(resultado.usuario);
                mostrarMensajeLogin('Acceso correcto. Redirigiendo...', 'exito');
                setTimeout(() => {
                    window.location.href = '../admin/dashboard.html';
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

// Proteccion automatica de paginas internas

// Si el body tiene el atributo data-admin-protected="true",
// protegemos la página automáticamente al cargar.
document.addEventListener('DOMContentLoaded', () => {
    if (document.body.dataset.adminProtected === 'true') {
        protegerPagina();
    }
});