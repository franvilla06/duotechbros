import * as configuracionModel from '../models/configuracion.model.js';

const CLAVES_PERMITIDAS = [
    'marca_nombre',
    'contacto_email',
    'email_admin',
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

// devuelve la configuración pública sin exponer el correo administrativo
export const obtenerConfiguracionPublica = async (req, res) => {
    try {
        const config = await configuracionModel.obtenerTodo(req.app.locals.pool);
        delete config.email_admin;
        return res.json(config);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// devuelve toda la configuración disponible para administración
export const obtenerConfiguracion = async (req, res) => {
    try {
        const config = await configuracionModel.obtenerTodo(req.app.locals.pool);
        return res.json(config);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// filtra y guarda las claves de configuración permitidas
export const actualizarConfiguracion = async (req, res) => {
    const cambios = req.body;

    if (!cambios || typeof cambios !== 'object') {
        return res.status(400).json({ success: false, error: 'Datos invalidos.' });
    }

    const cambiosFiltrados = {};
    // conserva solo las claves permitidas y normaliza sus valores como texto
    Object.entries(cambios).forEach(([clave, valor]) => {
        if (CLAVES_PERMITIDAS.includes(clave)) {
            cambiosFiltrados[clave] =
                valor === null || valor === undefined ? '' : String(valor).trim();
        }
    });

    if (Object.keys(cambiosFiltrados).length === 0) {
        return res
            .status(400)
            .json({ success: false, error: 'No se envio ninguna clave valida.' });
    }

    try {
        await configuracionModel.actualizarVarias(req.app.locals.pool, cambiosFiltrados);
        return res.json({
            success: true,
            message: 'Configuracion actualizada correctamente.',
            cambios: Object.keys(cambiosFiltrados).length,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
