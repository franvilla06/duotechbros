const path = require('path');
const Database = require('better-sqlite3');
const prepararBaseDatos = require('../services/database-setup.service');

const db = new Database(path.join(__dirname, '../../duotechbros.db'));
prepararBaseDatos(db);

module.exports = db;