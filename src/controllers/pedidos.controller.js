const bcrypt = require('bcryptjs');

function crearPedido(req, res) {
    const { nombre_cliente, telefono, email, modelo_celular, descripcion_problema } = req.body;
    if (!nombre_cliente || !email || !modelo_celular || !descripcion_problema) {
        return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
    }

    try {
        const insert = req.app.locals.db.prepare(`
            INSERT INTO pedidos (nombre_cliente, telefono, email, modelo_celular, descripcion_problema)
            VALUES (?, ?, ?, ?, ?)
        `);
        const info = insert.run(nombre_cliente, telefono, email, modelo_celular, descripcion_problema);
        return res.json({ success: true, id: info.lastInsertRowid });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

function listarPedidos(req, res) {
    try {
        const pedidos = req.app.locals.db.prepare('SELECT * FROM pedidos ORDER BY creado_en DESC').all();
        return res.json(pedidos);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

function listarProductos(req, res) {
    try {
        return res.json(req.app.locals.db.prepare('SELECT * FROM productos ORDER BY id DESC').all());
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

function listarPortafolio(req, res) {
    try {
        return res.json(req.app.locals.db.prepare('SELECT * FROM portafolio ORDER BY fecha DESC').all());
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

function iniciarSesion(req, res) {
    const { usuario, password } = req.body;
    try {
        const admin = req.app.locals.db.prepare('SELECT * FROM admin WHERE usuario = ?').get(usuario);
        if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
            return res.status(401).json({ success: false, error: 'Usuario o contraseña incorrectos' });
        }
        return res.json({ success: true, message: 'Login exitoso', usuario: admin.usuario });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = { crearPedido, listarPedidos, listarProductos, listarPortafolio, iniciarSesion };