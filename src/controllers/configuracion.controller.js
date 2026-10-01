const configuracionModel = require('../models/configuracion.model');

// claves que el admin puede modificar
// cualquier otra clave enviada se ignora por seguridad
const CLAVES_PERMITIDAS = [
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
];

// obtener toda la configuracion (publica)
function obtenerConfiguracion(req, res) {
    try {
        const config = configuracionModel.obtenerTodo(req.app.locals.db);
        return res.json(config);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

// actualizar la configuracion (solo admin)
function actualizarConfiguracion(req, res) {
    const cambios = req.body;

    if (!cambios || typeof cambios !== 'object') {
        return res.status(400).json({ success: false, error: 'Datos invalidos.' });
    }

    // filtrar solo las claves permitidas
    const cambiosFiltrados = {};
    Object.entries(cambios).forEach(([clave, valor]) => {
        if (CLAVES_PERMITIDAS.includes(clave)) {
            cambiosFiltrados[clave] = valor === null || valor === undefined ? '' : String(valor).trim();
        }
    });

    if (Object.keys(cambiosFiltrados).length === 0) {
        return res.status(400).json({ success: false, error: 'No se envio ninguna clave valida.' });
    }

    try {
        configuracionModel.actualizarVarias(req.app.locals.db, cambiosFiltrados);
        return res.json({
            success: true,
            message: 'Configuracion actualizada correctamente.',
            cambios: Object.keys(cambiosFiltrados).length,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = { obtenerConfiguracion, actualizarConfiguracion };