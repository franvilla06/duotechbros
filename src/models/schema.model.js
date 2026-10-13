// inicializa el esquema de la base de datos (MySQL)
// crea todas las tablas si no existen
// a diferencia de sqlite, mysql soporta IF NOT EXISTS de forma nativa
async function inicializarEsquema(pool) {
    const tablas = [
        // usuarios del sitio publico
        `CREATE TABLE IF NOT EXISTS usuarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario VARCHAR(30) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // administradores del panel
        `CREATE TABLE IF NOT EXISTS admin (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario VARCHAR(30) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // productos de la tienda
        `CREATE TABLE IF NOT EXISTS productos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(150) NOT NULL,
            descripcion TEXT,
            precio DECIMAL(10,2) NOT NULL,
            imagen_url VARCHAR(500),
            imagenes TEXT,
            categoria VARCHAR(80),
            stock INT DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // portafolio de trabajos realizados
        `CREATE TABLE IF NOT EXISTS portafolio (
            id INT AUTO_INCREMENT PRIMARY KEY,
            titulo VARCHAR(200) NOT NULL,
            descripcion TEXT,
            imagen_url VARCHAR(500),
            imagenes TEXT,
            tipo_reparacion VARCHAR(80),
            fecha DATE DEFAULT (CURRENT_DATE),
            fecha_inicio DATE,
            fecha_fin DATE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // pedidos (reparaciones y compras)
        `CREATE TABLE IF NOT EXISTS pedidos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre_cliente VARCHAR(150) NOT NULL,
            telefono VARCHAR(30) NOT NULL,
            email VARCHAR(100) NOT NULL,
            modelo_celular VARCHAR(120),
            descripcion_problema TEXT,
            estado VARCHAR(30) DEFAULT 'pendiente',
            notas TEXT,
            presupuesto DECIMAL(10,2),
            usuario_id INT,
            tipo VARCHAR(30) DEFAULT 'reparacion',
            creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_tipo (tipo),
            INDEX idx_estado (estado),
            INDEX idx_usuario (usuario_id),
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // items de cada pedido (solo para compras)
        `CREATE TABLE IF NOT EXISTS pedido_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            pedido_id INT NOT NULL,
            producto_id INT,
            nombre_producto VARCHAR(150) NOT NULL,
            precio_unitario DECIMAL(10,2) NOT NULL,
            cantidad INT NOT NULL,
            subtotal DECIMAL(10,2) NOT NULL,
            INDEX idx_pedido (pedido_id),
            FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // carrito de compras
        `CREATE TABLE IF NOT EXISTS carrito (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT NOT NULL,
            producto_id INT NOT NULL,
            cantidad INT NOT NULL DEFAULT 1,
            agregado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_usuario_producto (usuario_id, producto_id),
            INDEX idx_usuario (usuario_id),
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // codigos de verificacion (registro y recuperacion)
        `CREATE TABLE IF NOT EXISTS codigos_verificacion (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario VARCHAR(30) NOT NULL,
            email VARCHAR(100) NOT NULL,
            password_hash VARCHAR(255),
            codigo VARCHAR(6) NOT NULL,
            tipo VARCHAR(30) DEFAULT 'registro',
            intentos INT DEFAULT 0,
            usado TINYINT DEFAULT 0,
            creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
            expira_en DATETIME NOT NULL,
            INDEX idx_email_tipo (email, tipo)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // configuracion del sitio
        `CREATE TABLE IF NOT EXISTS configuracion (
            clave VARCHAR(100) PRIMARY KEY,
            valor TEXT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    ];

    // crear cada tabla si no existe
    for (const sql of tablas) {
        await pool.query(sql);
    }

    // agregar las columnas en bases existentes sin afectar los datos actuales
    await agregarColumnaSiNoExiste(pool, 'productos', 'imagenes', 'TEXT');
    await agregarColumnaSiNoExiste(pool, 'portafolio', 'imagenes', 'TEXT');

    // insertar el admin por defecto si no existe
    const [admins] = await pool.query(
        'SELECT COUNT(*) as count FROM admin WHERE usuario = ?',
        ['admin']
    );

    if (admins[0].count === 0) {
        const bcrypt = require('bcryptjs');
        const hash = bcrypt.hashSync('admin123', 10);
        await pool.query(
            'INSERT INTO admin (usuario, password_hash) VALUES (?, ?)',
            ['admin', hash]
        );
        console.log('Administrador creado: admin / admin123');
    }

    // valores por defecto de configuracion
    const valoresIniciales = {
        marca_nombre: 'DuotechBros',
        contacto_email: 'contacto@duotechbros.com',
        contacto_telefono: '+54 376 123-4567',
        contacto_whatsapp: '+54 376 123-4567',
        contacto_direccion: 'Posadas, Misiones',
        redes_instagram: '',
        redes_facebook: '',
        redes_tiktok: '',
        footer_terminos_url: '',
        footer_privacidad_url: '',
        aviso_general: '',
        horario_semana: '9:00 AM - 7:00 PM',
        horario_sabado: '10:00 AM - 4:00 PM',
        horario_domingo: 'Cerrado',
    };

    for (const [clave, valor] of Object.entries(valoresIniciales)) {
        await pool.query(
            'INSERT IGNORE INTO configuracion (clave, valor) VALUES (?, ?)',
            [clave, valor]
        );
    }
}

async function agregarColumnaSiNoExiste(pool, tabla, columna, tipo) {
    const [columnas] = await pool.query(`SHOW COLUMNS FROM \`${tabla}\` LIKE ?`, [columna]);
    if (columnas.length === 0) {
        await pool.query(`ALTER TABLE \`${tabla}\` ADD COLUMN \`${columna}\` ${tipo}`);
        console.log(`Migracion aplicada: columna ${columna} agregada a ${tabla}`);
    }
}

module.exports = inicializarEsquema;