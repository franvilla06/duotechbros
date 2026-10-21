import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { obtenerPool } from './config/database.js';

import { pedidosRoutes } from './routes/pedidos.routes.js';
import { adminRoutes } from './routes/admin.routes.js';
import { usuariosRoutes } from './routes/usuarios.routes.js';

// como en ES Modules __dirname no existe, lo recreamos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// exposicion del pool de conexiones a los controllers
app.locals.pool = obtenerPool();

// configuracion de CORS
// permite peticiones desde localhost y 127.0.0.1 en cualquier puerto
// esto incluye el puerto 3000 (backend) y 5500 (Live Server)
const corsOptions = {
    origin: (origin, callback) => {
        // permitir peticiones sin origin (Postman, curl, etc.)
        if (!origin) return callback(null, true);

        // permitir localhost y 127.0.0.1 en cualquier puerto
        const patronesPermitidos = [
            /^http:\/\/localhost(:\d+)?$/,
            /^http:\/\/127\.0\.0\.1(:\d+)?$/,
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