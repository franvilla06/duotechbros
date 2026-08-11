const express = require('express');
const cors = require('cors');
const db = require('./database.js'); //importa la instancia de la base de datos desde el archivo database.js

const app = express();
app.use(cors()); //habilita CORS para permitir solicitudes desde el frontend
app.use(express.json()); //habilita el análisis de JSON en las solicitudes entrantes
app.use(express.static('.'));//sirve archivos estáticos desde el directorio raíz (puede ser útil para servir el frontend si es necesario)

//ruta para gurdar un pedido
app.post('/api/pedidos', (req, res) => {
    const { nombre_cliente, telefono, email, modelo_celular, descripcion_problema } = req.body; //extrae los datos del pedido del cuerpo de la solicitud
     // Validación simple
    if (!nombre_cliente || !email || !modelo_celular || !descripcion_problema) {
        return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
    }
    const insert = db.prepare(`
        INSERT INTO pedidos (nombre_cliente, telefono, email, modelo_celular, descripcion_problema)
        VALUES (?, ?, ?, ?, ?)
    `); //prepara una consulta SQL para insertar un nuevo pedido en la base de datos
    try {
        const info = insert.run(nombre_cliente, telefono, email, modelo_celular, descripcion_problema);//ejecuta la consulta con los datos del pedido
        res.json({ success: true, id: info.lastInsertRowid });//devuelve una respuesta JSON indicando que el pedido se guardó correctamente y proporciona el ID del nuevo pedido
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });//si ocurre un error durante la inserción, devuelve una respuesta JSON con el mensaje de error
    }
});

//ruta para que el admin (despues) vea los pedidos
app.get('/api/pedidos', (req, res) => {
    const pedidos = db.prepare('SELECT * FROM pedidos ORDER BY creado_en DESC').all(); //prepara y ejecuta una consulta SQL para obtener todos los pedidos de la base de datos, ordenados por fecha de creación en orden descendente
    res.json(pedidos); //devuelve los pedidos como una respuesta JSON
});

// RUTA PÚBLICA: OBTENER PRODUCTOS
app.get('/api/productos', (req, res) => {
    try {
    const productos = db.prepare('SELECT * FROM productos ORDER BY id DESC').all();
    res.json(productos);
    } catch (error) {
    res.status(500).json({ success: false, error: error.message });
    }
});

// RUTA PÚBLICA: OBTENER PORTAFOLIO
app.get('/api/portafolio', (req, res) => {
    try {
    const trabajos = db.prepare('SELECT * FROM portafolio ORDER BY fecha DESC').all();
    res.json(trabajos);
    } catch (error) {
    res.status(500).json({ success: false, error: error.message });
    }
});

// RUTA DE LOGIN (PARA EL ADMIN)
app.post('/api/login', (req, res) => {
    const { usuario, password } = req.body;
    try {
    const admin = db.prepare('SELECT * FROM admin WHERE usuario = ?').get(usuario);
    if (!admin) {
        return res.status(401).json({ success: false, error: 'Usuario o contraseña incorrectos' });
    }
    const bcrypt = require('bcryptjs');
    const passwordValida = bcrypt.compareSync(password, admin.password_hash);
    if (!passwordValida) {
        return res.status(401).json({ success: false, error: 'Usuario o contraseña incorrectos' });
    }
    // Login exitoso (por ahora devolvemos un token simple)
    res.json({ success: true, message: 'Login exitoso', usuario: admin.usuario });
    } catch (error) {
    res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`)); //inicia el servidor en el puerto 3000 y muestra un mensaje en la consola indicando que el servidor está corriendo