// Backend/database.js
const Database = require('better-sqlite3');
const db = new Database('duotechbros.db'); // Usa el nombre que ya aparece en tu explorador

// Crear la tabla de pedidos si no existe
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
`);

// Tabla de portafolio
db.exec(`
    CREATE TABLE IF NOT EXISTS portafolio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    imagen_url TEXT,
    tipo_reparacion TEXT,
    fecha DATE DEFAULT CURRENT_DATE
    );
`);

// Tabla de productos (para la tienda)
db.exec(`
    CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    imagen_url TEXT,
    categoria TEXT,
    stock INTEGER DEFAULT 0
    );
`);

// Tabla de Admin
db.exec(`
    CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
    );
`);

//Inserta Admin Por Defecto
const adminExists = db.prepare("SELECT COUNT(*) as count FROM admin WHERE usuario = ?").get('admin');
if (adminExists.count === 0) {
    // La contraseña "admin123" hasheada con bcrypt (lo haremos después)
    // Por ahora insertamos directamente con un hash generado previamente
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('admin123', 10);
    const insertAdmin = db.prepare("INSERT INTO admin (usuario, password_hash) VALUES (?, ?)");
    insertAdmin.run('admin', hash);
    console.log('Administrador creado: admin / admin123');
}

console.log('Base de datos lista (tabla pedidos creada/verificada)');

module.exports = db;