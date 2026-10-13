# Datos de Prueba - DuotechBros

Este archivo contiene **SQL listo para pegar en MySQL** (phpMyAdmin) para cargar productos y trabajos de portafolio de ejemplo. Sirve para mostrar el sitio en funcionamiento sin tener que cargar todo manualmente.

---

## 📌 ¿Cómo usarlo?

### Paso 1: Arrancar XAMPP
1. Abrir el XAMPP Control Panel.
2. Iniciar el módulo **MySQL**.

### Paso 2: Levantar el servidor del proyecto
```bash
npm run dev
```

Esto crea la base de datos `duotechbros` con las tablas vacías.

### Paso 3: Ejecutar el SQL

1. Abrir **phpMyAdmin**: [http://localhost/phpmyadmin/](http://localhost/phpmyadmin/)
2. Seleccionar la base de datos **`duotechbros`** en la barra izquierda.
3. Ir a la pestaña **SQL**.
4. Copiar y pegar el bloque que quieras insertar (productos, portafolio, etc.).
5. Hacer clic en **Continuar**.

---

## 🛒 Productos de prueba

Copia y pega este bloque en la pestaña SQL. Inserta 15 accesorios con precios, categorías, stock e imágenes de ejemplo.

```sql
-- Limpiar productos existentes (opcional)
-- DELETE FROM productos;

INSERT INTO productos (nombre, descripcion, precio, imagen_url, categoria, stock) VALUES
('Funda iPhone 15 Silicona', 'Funda de silicona flexible con bordes reforzados y textura antideslizante.', 15.50, 'https://picsum.photos/seed/funda-iphone15/400/400', 'Fundas', 10),
('Funda Samsung Galaxy A22', 'Funda rígida con diseño translúcido y protección contra caídas.', 10.31, 'https://picsum.photos/seed/funda-a22/400/400', 'Fundas', 8),
('Auriculares Redmi Buds 4', 'Auriculares inalámbricos con cancelación de ruido activa y 30h de batería.', 20.50, 'https://picsum.photos/seed/redmi-buds/400/400', 'Auriculares', 5),
('Cargador Samsung 25W', 'Cargador rápido original Samsung con cable USB-C incluido.', 10.30, 'https://picsum.photos/seed/cargador-samsung/400/400', 'Cargadores', 15),
('Cable USB-C 1m', 'Cable de carga y datos USB-C a USB-A de 1 metro, reforzado.', 5.00, 'https://picsum.photos/seed/cable-usbc/400/400', 'Cables', 20),
('Protector Pantalla iPhone 15', 'Vidrio templado 9H con instalación fácil y protección contra rayaduras.', 3.50, 'https://picsum.photos/seed/protector-iphone15/400/400', 'Protectores', 30),
('Funda iPhone 13 Pro Transparente', 'Funda transparente con tecnología antiamarilleo y soporte MagSafe.', 18.00, 'https://picsum.photos/seed/funda-iphone13/400/400', 'Fundas', 6),
('Auriculares JBL Tune 510BT', 'Auriculares on-ear con sonido JBL Pure Bass y 40h de batería.', 25.00, 'https://picsum.photos/seed/jbl-tune/400/400', 'Auriculares', 4),
('Cargador Inalámbrico 15W', 'Base de carga inalámbrica Qi de 15W compatible con todos los celulares modernos.', 22.00, 'https://picsum.photos/seed/cargador-inal/400/400', 'Cargadores', 3),
('Cable Lightning 1m', 'Cable certificado MFi para iPhone, iPad y AirPods.', 6.00, 'https://picsum.photos/seed/cable-lightning/400/400', 'Cables', 12),
('Power Bank 10000mAh', 'Batería portátil con carga rápida y dos puertos USB.', 30.00, 'https://picsum.photos/seed/powerbank/400/400', 'Baterías Portátiles', 7),
('Soporte para Auto Magnético', 'Soporte para celular con imán reforzado y base para ventilación.', 12.00, 'https://picsum.photos/seed/soporte-auto/400/400', 'Accesorios', 9),
('Protector Cámara iPhone 14', 'Protector de vidrio templado para el módulo de cámara trasera.', 4.00, 'https://picsum.photos/seed/protector-camara/400/400', 'Protectores', 15),
('Funda Samsung Galaxy S23', 'Funda de cuero sintético premium con acabado mate.', 14.00, 'https://picsum.photos/seed/funda-s23/400/400', 'Fundas', 5),
('Adaptador USB-C a Jack 3.5mm', 'Adaptador para conectar auriculares con cable a celulares sin entrada jack.', 8.00, 'https://picsum.photos/seed/adaptador-jack/400/400', 'Adaptadores', 10);
```

---

## 🖼️ Portafolio de prueba

Inserta 8 trabajos realizados con fechas de inicio y fin coherentes.

```sql
-- Limpiar portafolio existente (opcional)
-- DELETE FROM portafolio;

INSERT INTO portafolio (titulo, descripcion, imagen_url, tipo_reparacion, fecha_inicio, fecha_fin) VALUES
('Cambio de pantalla iPhone 13 Pro', 'Reemplazo completo del display OLED con repuesto original certificado. Calibración de True Tone incluida.', 'https://picsum.photos/seed/rep-pantalla-iphone13/600/400', 'Pantalla', '2026-09-15', '2026-09-16'),
('Cambio de batería Samsung Galaxy S22', 'Sustitución de batería original Samsung con reprogramación de ciclos de carga.', 'https://picsum.photos/seed/rep-bateria-s22/600/400', 'Batería', '2026-09-18', '2026-09-19'),
('Reparación placa base MacBook Pro M2', 'Reparación de micro-soldadura en placa base dañada por líquido. Recuperación total del funcionamiento.', 'https://picsum.photos/seed/rep-placa-macbook/600/400', 'Placa Base', '2026-09-20', '2026-09-25'),
('Recuperación de datos iPhone 12', 'Extracción de datos de dispositivo bloqueado en bootloop. Se recuperaron fotos y contactos.', 'https://picsum.photos/seed/rep-datos-iphone12/600/400', 'Software', '2026-09-28', '2026-09-29'),
('Cambio módulo de carga Samsung A52', 'Reemplazo del puerto de carga USB-C y limpieza del conector.', 'https://picsum.photos/seed/rep-modulo-a52/600/400', 'Módulo de Carga', '2026-10-01', '2026-10-01'),
('Reemplazo de cámara trasera iPhone 14', 'Cambio del módulo de cámara triple con repuesto original. Funcionamiento 100% restaurado.', 'https://picsum.photos/seed/rep-camara-iphone14/600/400', 'Cámara', '2026-10-03', '2026-10-04'),
('Cambio de pantalla Xiaomi Redmi Note 11', 'Reemplazo de pantalla LCD con repuesto compatible y calibración de táctil.', 'https://picsum.photos/seed/rep-pantalla-redmi/600/400', 'Pantalla', '2026-10-05', '2026-10-06'),
('Reparación de altavoz iPhone 11', 'Cambio del altavoz inferior y limpieza del sistema de audio.', 'https://picsum.photos/seed/rep-altavoz-iphone11/600/400', 'Otro', '2026-10-07', '2026-10-07');
```

---

## ⚙️ Configuración del sitio (opcional)

Actualiza la configuración del sitio con datos de ejemplo (marca, contacto, redes).

```sql
-- Actualizar la configuracion del sitio
UPDATE configuracion SET valor = 'DuotechBros' WHERE clave = 'marca_nombre';
UPDATE configuracion SET valor = 'contacto@duotechbros.com' WHERE clave = 'contacto_email';
UPDATE configuracion SET valor = '+54 376 400-1234' WHERE clave = 'contacto_telefono';
UPDATE configuracion SET valor = '+54 376 400-1234' WHERE clave = 'contacto_whatsapp';
UPDATE configuracion SET valor = 'Posadas, Misiones, Argentina' WHERE clave = 'contacto_direccion';
UPDATE configuracion SET valor = 'https://instagram.com/duotechbros' WHERE clave = 'redes_instagram';
UPDATE configuracion SET valor = 'https://facebook.com/duotechbros' WHERE clave = 'redes_facebook';
UPDATE configuracion SET valor = 'https://tiktok.com/@duotechbros' WHERE clave = 'redes_tiktok';
UPDATE configuracion SET valor = '' WHERE clave = 'aviso_general';
-- Para mostrar un aviso general, descomentar y editar:
-- UPDATE configuracion SET valor = 'Cerrado por vacaciones del 15 al 22 de enero. Volvemos pronto.' WHERE clave = 'aviso_general';
```

---

## 👥 Usuarios de prueba (opcional)

Para probar el flujo de usuario (carrito, pedidos, historial), lo más fácil es **registrarse a través de la página web** porque así se hashea la contraseña correctamente.

### ¿Cómo crear un usuario de prueba?

1. Ir a `http://localhost:3000/user/login.html`.
2. Clic en **"Registrarme"**.
3. Completar:

- **Usuario:** `cliente01`
- **Email:** `cliente01@ejemplo.com`
- **Contraseña:** `123456`

4. Copiar el código de 6 dígitos que aparece en la **consola del servidor**.
5. Ingresarlo en la pantalla de verificación.
6. Ya podés iniciar sesión con `cliente01@ejemplo.com` y `123456`.

> **Tip:** Creá 2 o 3 usuarios de prueba para probar el historial de cada uno.

---

## 📦 Pedidos de prueba (opcional)

Para tener pedidos de prueba, seguí este flujo:

### Pedidos de reparación

1. Logueate como usuario en `http://localhost:3000/user/login.html`.
2. Ir a `http://localhost:3000/pedidos.html`.
3. Completar el formulario:

- Nombre: `Juan Pérez`
- Email: `juan@ejemplo.com`
- Teléfono: `3764001234`
- Modelo: `Samsung Galaxy S21`
- Descripción: `No carga, se apaga solo.`

4. Enviar.

### Compras de tienda

1. Ir a `http://localhost:3000/tienda.html`.
2. Agregar 2-3 productos al carrito.
3. Ir al carrito y enviar el pedido.

Con esos pedidos vas a tener datos para ver el dashboard con gráficos, las tablas del admin y el historial del usuario.

---

## 🧹 Limpiar los datos de prueba

Si querés volver a empezar de cero:

```sql
-- Borrar todos los productos
DELETE FROM productos;
ALTER TABLE productos AUTO_INCREMENT = 1;

-- Borrar todo el portafolio
DELETE FROM portafolio;
ALTER TABLE portafolio AUTO_INCREMENT = 1;

-- Borrar items y pedidos (en orden por las foreign keys)
DELETE FROM pedido_items;
DELETE FROM pedidos;
ALTER TABLE pedidos AUTO_INCREMENT = 1;
ALTER TABLE pedido_items AUTO_INCREMENT = 1;

-- Borrar carritos
DELETE FROM carrito;
ALTER TABLE carrito AUTO_INCREMENT = 1;

-- Borrar usuarios (esto también elimina sus carritos por CASCADE)
DELETE FROM usuarios;
ALTER TABLE usuarios AUTO_INCREMENT = 1;

-- Borrar códigos de verificación pendientes
DELETE FROM codigos_verificacion;
ALTER TABLE codigos_verificacion AUTO_INCREMENT = 1;
```

> **Nota:** `ALTER TABLE ... AUTO_INCREMENT = 1` reinicia los contadores para que los nuevos registros empiecen en ID 1 otra vez.
