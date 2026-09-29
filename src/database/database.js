const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, '../../duotechbros.db'));

db.exec(`
    CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_cliente TEXT NOT NULL,
        telefono TEXT NOT NULL,
        email TEXT NOT NULL,
        modelo_celular TEXT,
        descripcion_problema TEXT,
        estado TEXT DEFAULT 'pendiente',
        creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS portafolio (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        descripcion TEXT,
        imagen_url TEXT,
        tipo_reparacion TEXT,
        fecha DATE DEFAULT CURRENT_DATE
    );
    CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        precio DECIMAL(10,2) NOT NULL,
        imagen_url TEXT,
        categoria TEXT,
        stock INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS admin (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
    );
`);

// MIGRACIONES
// agregar columnas nuevas a tablas existentes sin perder datos

// MIGRACIÓN: AGREGAR COLUMNA "NOTAS" A PEDIDOS SI NO EXISTE
const columnasPedidos = db.prepare('PRAGMA table_info(pedidos)').all();
const tieneNotas = columnasPedidos.some((col) => col.name === 'notas');
if (!tieneNotas) {
    db.exec('ALTER TABLE pedidos ADD COLUMN notas TEXT');
    console.log('Migración aplicada: columna "notas" agregada a pedidos');
}

// DATOS INICIALES

const adminExists = db.prepare('SELECT COUNT(*) as count FROM admin WHERE usuario = ?').get('admin');
if (adminExists.count === 0) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO admin (usuario, password_hash) VALUES (?, ?)').run('admin', hash);
    console.log('Administrador creado: admin / admin123');
}

console.log('Base de datos lista');

module.exports = db;