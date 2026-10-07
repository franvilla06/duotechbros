const path = require('path');
const express = require('express');
const cors = require('cors');
const { obtenerPool } = require('./config/database');

const pedidosRoutes = require('./routes/pedidos.routes');
const adminRoutes = require('./routes/admin.routes');
const usuariosRoutes = require('./routes/usuarios.routes');

const app = express();

// exponer el pool de conexiones a todos los controllers
// (los controllers lo van a usar como req.app.locals.pool)
app.locals.pool = obtenerPool();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api', pedidosRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/usuarios', usuariosRoutes);

module.exports = app;