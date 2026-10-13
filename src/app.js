const path = require('path');
const express = require('express');
const cors = require('cors');
const { obtenerPool } = require('./config/database');

const pedidosRoutes = require('./routes/pedidos.routes');
const adminRoutes = require('./routes/admin.routes');
const usuariosRoutes = require('./routes/usuarios.routes');

const app = express();

// exposicion del pool de conexiones a los controllers
app.locals.pool = obtenerPool();

// configuracion de CORS
// permite peticiones desde localhost y 127.0.0.1 en cualquier puerto
// esto incluye el puerto 3000 (backend) y 5500 (Live Server)
const corsOptions = {
    origin: function (origin, callback) {
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

module.exports = app;