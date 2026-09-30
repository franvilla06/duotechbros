const bcrypt = require('bcryptjs');
const adminModel = require('../models/admin.model');
const schemaModel = require('../models/schema.model');

function prepararBaseDatos(db) {
    schemaModel.inicializar(db);

    const adminExists = adminModel.contarPorUsuario(db, 'admin');
    if (adminExists.count === 0) {
        const hash = bcrypt.hashSync('admin123', 10);
        adminModel.crear(db, 'admin', hash);
        console.log('Administrador creado: admin / admin123');
    }

    console.log('Base de datos lista');
}

module.exports = prepararBaseDatos;
