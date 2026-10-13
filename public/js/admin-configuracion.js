// LOGICA DE LA PAGINA "CONFIGURACION DEL SITIO" - DUOTECHBROS ADMIN

const API_CONFIG_PUBLICA = '/api/configuracion';
const API_ADMIN_CONFIG = '/api/admin/configuracion';

const form = document.getElementById('form-config');
const estadoCargando = document.getElementById('estado-cargando');
const estadoError = document.getElementById('estado-error');
const btnRefresh = document.getElementById('btn-refresh');
const btnCancelar = document.getElementById('btn-cancelar');
const btnGuardar = document.getElementById('btn-guardar');

// lista de todos los campos del formulario
// se usan para leer/rellenar de forma generica
const CAMPOS = [
    'marca_nombre',
    'contacto_email',
    'contacto_telefono',
    'contacto_whatsapp',
    'contacto_direccion',
    'redes_instagram',
    'redes_facebook',
    'redes_tiktok',
    'footer_terminos_url',
    'footer_privacidad_url',
    'aviso_general',
    'horario_semana',
    'horario_sabado',
    'horario_domingo',
];

// configuracion original cargada desde el servidor
// sirve para detectar cambios sin guardar
let configOriginal = {};

// UTILIDADES

function mostrarToast(mensaje, esError = false) {
    const anterior = document.getElementById('toast-admin');
    if (anterior) anterior.remove();

    const toast = document.createElement('div');
    toast.id = 'toast-admin';
    toast.className = 'toast-admin' + (esError ? ' toast-error' : '');
    toast.innerHTML = `<span>${mensaje}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('toast-visible'), 10);
    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// rellena el formulario con los valores de configuracion
function rellenarFormulario(config) {
    CAMPOS.forEach((campo) => {
        const input = document.getElementById(campo);
        if (input) {
            input.value = config[campo] || '';
        }
    });
}

// lee los valores actuales del formulario
function leerFormulario() {
    const datos = {};
    CAMPOS.forEach((campo) => {
        const input = document.getElementById(campo);
        if (input) {
            datos[campo] = input.value.trim();
        }
    });
    return datos;
}

// detecta si el formulario tiene cambios respecto a la config original
function hayCambios() {
    const actual = leerFormulario();
    return CAMPOS.some((campo) => {
        const orig = configOriginal[campo] || '';
        const act = actual[campo] || '';
        return orig !== act;
    });
}

// CARGA DE DATOS

async function cargarConfiguracion() {
    estadoCargando.style.display = 'block';
    form.style.display = 'none';
    estadoError.style.display = 'none';

    try {
        const respuesta = await fetch(API_CONFIG_PUBLICA);
        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

        const config = await respuesta.json();
        configOriginal = config;

        rellenarFormulario(config);
        form.style.display = 'block';
    } catch (error) {
        console.error('Error al cargar configuracion:', error);
        estadoError.style.display = 'block';
    } finally {
        estadoCargando.style.display = 'none';
    }
}

// GUARDAR CAMBIOS

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!hayCambios()) {
        mostrarToast('No hay cambios para guardar.', true);
        return;
    }

    const datos = leerFormulario();

    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    try {
        const respuesta = await fetchAdmin(API_ADMIN_CONFIG, {
            method: 'PUT',
            body: JSON.stringify(datos),
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            mostrarToast('Configuración guardada correctamente.');

            // actualizar la referencia original con los nuevos valores
            configOriginal = { ...datos };
        } else {
            mostrarToast(`Error: ${resultado.error || 'No se pudo guardar.'}`, true);
        }
    } catch (error) {
        console.error('Error al guardar configuracion:', error);
        mostrarToast('No se pudo conectar con el servidor.', true);
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar cambios';
    }
});

// DESCARTAR CAMBIOS

btnCancelar.addEventListener('click', () => {
    if (!hayCambios()) {
        mostrarToast('No hay cambios para descartar.', true);
        return;
    }

    const confirmar = confirm('¿Descartar todos los cambios sin guardar?');
    if (!confirmar) return;

    rellenarFormulario(configOriginal);
    mostrarToast('Cambios descartados.');
});

// RECARGAR

btnRefresh.addEventListener('click', () => {
    if (hayCambios()) {
        const confirmar = confirm(
            'Tenés cambios sin guardar. Si recargás, se van a perder.\n\n¿Querés continuar?'
        );
        if (!confirmar) return;
    }

    cargarConfiguracion();
});

// INICIO

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(cargarConfiguracion, 100);
});