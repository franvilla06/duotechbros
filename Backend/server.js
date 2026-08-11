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

// Ruta para obtener el portafolio
app.get('/api/portafolio', (req, res) => {
    const portafolio = db.prepare('SELECT * FROM portafolio ORDER BY fecha DESC').all();
    res.json(portafolio);
});

// Ruta para obtener los productos
app.get('/api/productos', (req, res) => {
    const productos = db.prepare('SELECT * FROM productos ORDER BY nombre').all();
    res.json(productos);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`)); //inicia el servidor en el puerto 3000 y muestra un mensaje en la consola indicando que el servidor está corriendo