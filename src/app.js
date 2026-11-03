import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { obtenerPool } from './config/database.js';

import { pedidosRoutes } from './routes/pedidos.routes.js';
import { adminRoutes } from './routes/admin.routes.js';
import { usuariosRoutes } from './routes/usuarios.routes.js';

// reconstruye las rutas equivalentes a __filename y __dirname para este módulo
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Confiar en el proxy de Render para obtener la IP real del cliente
app.set('trust proxy', 1);

// expone el pool de conexiones para que lo usen los controladores
app.locals.pool = obtenerPool();

// CONFIGURACIÓN DE CORS
// permite solicitudes locales desde cualquier puerto
const corsOptions = {
    // valida el origen de cada solicitud y permite las peticiones sin origen
    origin: (origin, callback) => {
        // admite clientes que no envían un origen, como Postman o curl
        if (!origin) return callback(null, true);

        // restringe las solicitudes con origen a los dos hosts locales
        const patronesPermitidos = [
            /^http:\/\/localhost(:\d+)?$/,
            /^http:\/\/127\.0\.0\.1(:\d+)?$/,
            /^https:\/\/duotechbros\.onrender\.com$/
        ];

        const permitido = patronesPermitidos.some((patron) => patron.test(origin));

        if (permitido) {
            return callback(null, true);
        }

        console.warn(`Origen bloqueado por CORS: ${origin}`);
        return callback(new Error('No permitido por CORS'));
    },
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api', pedidosRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/usuarios', usuariosRoutes);

app.use((error, req, res, next) => {
    if (res.headersSent) {
        next(error);
        return;
    }

    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'La imagen es demasiado grande. El límite es 2MB.',
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                error: 'Puedes subir un máximo de 5 imágenes a la vez.',
            });
        }
    }

    if (error.message?.startsWith('Formato de archivo')) {
        return res.status(400).json({ success: false, error: error.message });
    }

    console.error(error.stack || error);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
});