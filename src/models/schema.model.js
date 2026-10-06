function inicializar(db) {
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
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario TEXT UNIQUE NOT NULL,
            email TEXT,
            password_hash TEXT NOT NULL,
            creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS carrito (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            producto_id INTEGER NOT NULL,
            cantidad INTEGER NOT NULL DEFAULT 1,
            agregado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (usuario_id, producto_id),
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS pedido_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pedido_id INTEGER NOT NULL,
            producto_id INTEGER,
            nombre_producto TEXT NOT NULL,
            precio_unitario DECIMAL(10,2) NOT NULL,
            cantidad INTEGER NOT NULL,
            subtotal DECIMAL(10,2) NOT NULL,
            FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS configuracion (
            clave TEXT PRIMARY KEY,
            valor TEXT
        );
        CREATE TABLE IF NOT EXISTS codigos_verificacion (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario TEXT NOT NULL,
            email TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            codigo TEXT NOT NULL,
            intentos INTEGER DEFAULT 0,
            usado INTEGER DEFAULT 0,
            creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
            expira_en DATETIME NOT NULL
        );
    `);

    // migraciones de pedidos
    const columnasPedidos = db.prepare('PRAGMA table_info(pedidos)').all();

    if (!columnasPedidos.some((col) => col.name === 'notas')) {
        db.exec('ALTER TABLE pedidos ADD COLUMN notas TEXT');
        console.log('Migracion aplicada: columna notas agregada a pedidos');
    }

    if (!columnasPedidos.some((col) => col.name === 'usuario_id')) {
        db.exec('ALTER TABLE pedidos ADD COLUMN usuario_id INTEGER');
        console.log('Migracion aplicada: columna usuario_id agregada a pedidos');
    }

    if (!columnasPedidos.some((col) => col.name === 'tipo')) {
        db.exec("ALTER TABLE pedidos ADD COLUMN tipo TEXT DEFAULT 'reparacion'");
        console.log('Migracion aplicada: columna tipo agregada a pedidos');
    }

    if (!columnasPedidos.some((col) => col.name === 'presupuesto')) {
        db.exec('ALTER TABLE pedidos ADD COLUMN presupuesto DECIMAL(10,2)');
        console.log('Migracion aplicada: columna presupuesto agregada a pedidos');
    }

    // migraciones de portafolio
    const columnasPortafolio = db.prepare('PRAGMA table_info(portafolio)').all();

    if (!columnasPortafolio.some((col) => col.name === 'fecha_inicio')) {
        db.exec('ALTER TABLE portafolio ADD COLUMN fecha_inicio DATE');
        console.log('Migracion aplicada: columna fecha_inicio agregada a portafolio');
    }

    if (!columnasPortafolio.some((col) => col.name === 'fecha_fin')) {
        db.exec('ALTER TABLE portafolio ADD COLUMN fecha_fin DATE');
        console.log('Migracion aplicada: columna fecha_fin agregada a portafolio');
    }

    // migracion de usuarios: agregar columna email si no existe
    const columnasUsuarios = db.prepare('PRAGMA table_info(usuarios)').all();
    if (!columnasUsuarios.some((col) => col.name === 'email')) {
        db.exec('ALTER TABLE usuarios ADD COLUMN email TEXT');
        console.log('Migracion aplicada: columna email agregada a usuarios');
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
    };

    const insertarConfig = db.prepare(
        'INSERT OR IGNORE INTO configuracion (clave, valor) VALUES (?, ?)'
    );

    Object.entries(valoresIniciales).forEach(([clave, valor]) => {
        insertarConfig.run(clave, valor);
    });
}

module.exports = { inicializar };