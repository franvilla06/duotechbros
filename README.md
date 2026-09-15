# DuotechBros - Proyecto Web y Gestión de Pedidos

## Tabla de Contenidos

1. [Descripción General del Proyecto](#1-descripción-general-del-proyecto)
2. [Tecnologías y Lenguajes Utilizados](#2-tecnologías-y-lenguajes-utilizados)
3. [Estado Actual y Logros Alcanzados](#3-estado-actual--logros-alcanzados)
4. [Módulo de Administración](#4-módulo-de-administración)
5. [Estructura y Secciones del Proyecto](#5-estructura-y-secciones-del-proyecto)
6. [Descripción Detallada del Backend](#6-descripción-detallada-del-backend)
7. [Descripción Detallada del Frontend](#7-descripción-detallada-del-frontend)
8. [Base de Datos](#8-base-de-datos)
9. [Guía de Instalación y Configuración](#9-guía-de-instalación-y-configuración)
10. [Guía de Uso](#10-guía-de-uso)
11. [Flujo de Datos del Sistema](#11-flujo-de-datos-del-sistema)
12. [Control de Versiones y Ramas](#12-control-de-versiones-y-ramas)
13. [Extensión y Desarrollo Futuro](#13-extensión-y-desarrollo-futuro)
14. [Resolución de Problemas Comunes](#14-resolución-de-problemas-comunes)
15. [Contribuciones y Mejoras Futuras](#15-contribuciones-y-mejoras-futuras)

---

## 1. Descripción General del Proyecto

Este proyecto corresponde a una solución web para la empresa DuotechBros, orientada a mostrar sus servicios, fortalecer su presencia digital y permitir la gestión básica de pedidos de reparación de celulares y accesorios.

La aplicación combina un sitio institucional estático con un backend ligero para recibir solicitudes de clientes y almacenarlas en una base de datos local. Su objetivo principal es ofrecer una plataforma sencilla, funcional y fácil de mantener para que la empresa pueda presentar su propuesta de valor y captar solicitudes de contacto o reparación desde la web.

### Arquitectura general

El proyecto sigue una arquitectura modular de tres capas:

- Frontend: páginas HTML, estilos CSS y JavaScript vanilla para la interfaz del usuario.
- Backend: servidor Node.js con Express, organizado en aplicación, rutas y controladores.
- Base de datos: SQLite gestionada mediante better-sqlite3 para almacenar los pedidos recibidos.

En términos prácticos, el usuario accede a las páginas del sitio, completa un formulario de reparación y el sistema envía esos datos al backend, que los persiste en la base de datos.

---

## 2. Tecnologías y Lenguajes Utilizados

### Lenguajes de programación

- HTML5: estructura de las páginas web.
- CSS3: estilos visuales del sitio.
- JavaScript: lógica del formulario, validaciones y consumo de la API.
- SQL: estructura y consultas de la base de datos SQLite.
- Node.js: entorno de ejecución del servidor backend.

### Frameworks, librerías y herramientas

- Express.js: servidor web y manejo de rutas/API.
- CORS: habilitación de solicitudes entre frontend y backend.
- better-sqlite3: conexión y acceso a la base de datos SQLite.
- bcryptjs: dependencia instalada en el proyecto, disponible para futuras mejoras de autenticación.
- npm: gestión de dependencias y scripts.
- Git/GitHub: control de versiones del repositorio.
- Font Awesome: iconografía usada en la interfaz.
- SQLite: motor de base de datos local.

### Archivos y tecnologías de soporte

- Normalize.css: base de estilos para homogeneizar el comportamiento entre navegadores.
- Archivo de base de datos local: duotechbros.db.
- Servidor estático generado por Express desde la raíz del proyecto.

---

## 3. Estado Actual y Logros Alcanzados

El proyecto se encuentra en una etapa funcional de prototipo MVP (producto mínimo viable), con las siguientes funcionalidades ya implementadas y operativas:

### Funcionalidades desarrolladas

- Sitio web institucional completo con secciones de inicio, portafolio, tienda y contacto/reparación.
- Diseño consistente con encabezado, navegación superior y pie de página reutilizados en las páginas principales.
- Página de inicio con información institucional, servicios ofrecidos y llamados a la acción.
- Página de portafolio con enlaces a proyectos destacados.
- Página de tienda con estructura preparada para mostrar productos o servicios.
- Formulario de solicitud de reparación con validaciones de entrada en el navegador.
- Envío de datos del formulario a un endpoint backend mediante fetch.
- Backend con endpoints para registrar pedidos y consultar pedidos almacenados.
- Base de datos SQLite creada automáticamente al iniciar el servidor.
- Persistencia de pedidos mediante tabla pedidos.
- **Panel de administración con módulo de autenticación**.
- **Interfaz administrativa para gestionar productos, portafolio y pedidos**.
- **Página de login para acceso seguro al área administrativa**.
- **Dashboard centralizado para operaciones administrativas**.

### Logros alcanzados

- Se consolidó una estructura organizada del proyecto para continuar escalando el desarrollo.
- Se integró la lógica frontend-backend de forma básica pero funcional.
- Se estableció la base para futuras mejoras como panel administrativo, edición de pedidos y catálogo dinámico.
- El sistema ya permite registrar solicitudes reales del cliente en una base de datos local.
- **Se implementó un módulo administrativo completo con interfaz de usuario**.
- **Se creó un sistema de autenticación para acceso al panel de administración**.
- **Se desarrolló una interfaz dedicada para la gestión de productos, portafolio y pedidos**.
- **Se estableció la estructura base para operaciones CRUD en el área administrativa**.

### Estado general

El proyecto está listo para ser probado localmente y extendido con nuevas funcionalidades. Actualmente funciona como una plataforma web orientada a operaciones básicas de captación de clientes y almacenamiento de pedidos, con un panel administrativo inicial para la gestión de contenidos.

---

## 4. Módulo de Administración

### Descripción

El módulo administrativo permite a los usuarios autenticados gestionar los contenidos y pedidos del sitio web DuotechBros. Incluye un sistema de autenticación, un dashboard centralizado y diferentes paneles para la gestión de datos.

### Componentes del módulo administrativo

#### login.html

Página de inicio de sesión para administradores. Proporciona un formulario seguro para autenticarse y acceder al panel de administración.

#### dashboard.html

Panel principal del administrador que actúa como punto central de navegación hacia las diferentes secciones de gestión.

#### productos.html

Interfaz para gestionar el catálogo de productos. Permite visualizar, agregar, editar y eliminar productos del sistema.

#### portafolio.html

Interfaz para gestionar los trabajos destacados del portafolio. Permite administrar los proyectos mostrados en la sección pública de portafolio.

#### pedidos.html

Panel de visualización y gestión de pedidos recibidos desde el formulario de solicitud pública. Permite revisar, procesar y actualizar el estado de los pedidos.

#### admin.js

Script que contiene la lógica del cliente para el módulo administrativo, incluyendo:

- Manejo de autenticación y sesión
- Comunicación con los endpoints de la API
- Validación de formularios
- Actualización dinámica de contenido

#### admin.css

Estilos específicos del panel administrativo para proporcionar una interfaz clara, profesional y funcional.

### Endpoints de API utilizados

El módulo administrativo se comunica con el backend mediante los siguientes endpoints:

- `POST /api/login`: autenticación de usuarios administradores
- `GET /api/pedidos`: obtener lista de pedidos
- `GET /api/productos`: obtener catálogo de productos
- `GET /api/portafolio`: obtener trabajos del portafolio
- Y futuros endpoints para crear, actualizar y eliminar recursos

---

## 5. Estructura y Secciones del Proyecto

La estructura del repositorio es la siguiente:

```text
Proyecto_DuotechBros/
├── public/
│   ├── admin/
│   │   ├── login.html
│   │   ├── dashboard.html
│   │   ├── productos.html
│   │   ├── portafolio.html
│   │   ├── pedidos.html
│   │   └── admin.js
│   ├── css/
│   │   ├── inicio.css
│   │   ├── normalize.css
│   │   ├── pedidos.css
│   │   ├── pie_encabezado.css
│   │   ├── portafolio.css
│   │   ├── tienda.css
│   │   └── admin.css
│   ├── img/
│   │   ├── Bienvenida.svg
│   │   └── Equipo duotechbros.jpg
│   ├── js/
│   │   └── Script_Pedidos.js
│   ├── inicio.html
│   ├── pedidos.html
│   ├── portafolio.html
│   └── tienda.html
├── src/
│   ├── controllers/
│   │   └── pedidos.controller.js
│   ├── database/
│   │   └── database.js
│   ├── routes/
│   │   └── pedidos.routes.js
│   ├── app.js
│   └── server.js
├── duotechbros.db
├── package.json
├── package-lock.json
└── README.md
```

### Explicación de los componentes principales

#### public/

Contiene todos los recursos públicos que Express sirve como archivos estáticos:

- `*.html`: páginas del sitio.
- `admin/`: módulo administrativo con panel de control, gestión de productos, portafolio y pedidos.
- `css/`: estilos de cada sección y estilos compartidos.
- `js/`: lógica del formulario de pedidos y scripts administrativos.
- `img/`: imágenes utilizadas por la interfaz.

#### public/admin/

Contiene las páginas y lógica del panel de administración:

- `login.html`: página de inicio de sesión para administradores.
- `dashboard.html`: panel principal de administración.
- `productos.html`: gestión de productos del catálogo.
- `portafolio.html`: gestión de trabajos del portafolio.
- `pedidos.html`: visualización y gestión de pedidos recibidos.
- `admin.js`: lógica del lado del cliente para el panel administrativo.

#### public/css/

Contiene los estilos de cada sección del sitio:

- inicio.css: estilos de la página principal.
- pedidos.css: estilos del formulario de reparación.
- portafolio.css: estilos de la sección de portafolio.
- tienda.css: estilos de la sección de tienda.
- pie_encabezado.css: estilos compartidos del encabezado y el pie de página.
- normalize.css: reset de estilos para compatibilidad entre navegadores.
- admin.css: estilos del panel administrativo.

#### public/\*.html

Contiene las páginas del sitio:

- inicio.html: landing page institucional.
- pedidos.html: formulario para solicitar reparación o contacto.
- portafolio.html: presentación de proyectos destacados.
- tienda.html: estructura de la sección de tienda.

#### public/js/

- Script_Pedidos.js: gestiona el formulario de pedidos, valida los campos y envía los datos al backend.

#### public/img/

Incluye imágenes visuales para la identidad del negocio, como la foto del equipo y una imagen de bienvenida.

---

## 6. Descripción Detallada del Backend

El backend del proyecto DuotechBros está construido con Node.js y Express.js, siguiendo una arquitectura de capas que separa responsabilidades entre rutas, controladores y acceso a datos.

### Punto de entrada: server.js

El archivo `src/server.js` es el punto de inicio de toda la aplicación. Sus responsabilidades incluyen:

- Cargar y configurar la aplicación Express desde `app.js`
- Definir el puerto en el cual escuchará el servidor (puerto 3000 por defecto)
- Inicializar la conexión con la base de datos
- Mostrar mensajes de confirmación cuando el servidor está listo
- Manejar errores críticos durante el inicio

**Flujo de ejecución**: `npm run dev` → `server.js` → `app.js` → Servidor en http://localhost:3000

### Configuración de la aplicación: app.js

El archivo `src/app.js` configura Express y prepara la aplicación para recibir solicitudes. Sus funciones principales son:

- **Importar dependencias**: Express, CORS, rutas, y base de datos
- **Habilitar CORS**: permite que el frontend (en localhost:3000) realice solicitudes a la API
- **Middleware JSON**: configura Express para parsear automáticamente JSON en solicitudes POST y PUT
- **Archivos estáticos**: sirve los archivos públicos (HTML, CSS, imágenes, JS) desde la carpeta `public/`
- **Rutas de API**: registra todas las rutas bajo el prefijo `/api` usando `pedidos.routes.js`
- **Exportar la aplicación**: permite que `server.js` la importe y ejecute

**Tecnología usada**: Express 4.x con middleware nativo

### Rutas: pedidos.routes.js

El archivo `src/routes/pedidos.routes.js` define todos los endpoints disponibles en la API REST. Estructura actual:

```javascript
POST   /api/login      - Autentica usuarios administradores
GET    /api/pedidos    - Obtiene la lista de todos los pedidos
POST   /api/pedidos    - Crea un nuevo pedido
GET    /api/productos  - Obtiene la lista de productos
POST   /api/productos  - Crea un nuevo producto
GET    /api/portafolio - Obtiene los trabajos del portafolio
POST   /api/portafolio - Agrega un trabajo al portafolio
```

Cada ruta mapea a una función específica en el controlador `pedidos.controller.js`.

### Controladores: pedidos.controller.js

El archivo `src/controllers/pedidos.controller.js` implementa toda la lógica de negocio. Contiene las siguientes funciones:

#### login(req, res)

- **Descripción**: Autentica un usuario administrador
- **Entrada**: `{ usuario: string, password: string }`
- **Salida**: `{ success: boolean, mensaje: string }`
- **Base de datos**: Consulta la tabla `admin` para verificar credenciales
- **Nota**: Actualmente usa comparación directa de contraseñas (mejorar con bcryptjs)

#### obtenerPedidos(req, res)

- **Descripción**: Obtiene todos los pedidos almacenados
- **Entrada**: Ninguna
- **Salida**: Array de objetos con los datos de cada pedido
- **Base de datos**: SELECT de la tabla `pedidos`
- **Uso típico**: El panel de administración los consulta para mostrar la lista de pedidos

#### crearPedido(req, res)

- **Descripción**: Registra un nuevo pedido de reparación
- **Entrada**: `{ nombre_cliente, telefono, email, modelo_celular, descripcion_problema }`
- **Salida**: `{ success: boolean, id: number }`
- **Base de datos**: INSERT en la tabla `pedidos`
- **Validación**: Verifica que todos los campos estén presentes
- **Timestamp**: Registra automáticamente la fecha y hora del pedido

#### obtenerProductos(req, res)

- **Descripción**: Obtiene el catálogo de productos
- **Entrada**: Ninguna
- **Salida**: Array de productos con nombre, descripción y precio
- **Base de datos**: SELECT de la tabla `productos`
- **Extensión futura**: Podrá incluir filtros, búsqueda y paginación

#### crearProducto(req, res)

- **Descripción**: Agrega un nuevo producto al catálogo
- **Entrada**: `{ nombre, descripcion, precio, imagen_url }`
- **Salida**: `{ success: boolean, id: number }`
- **Base de datos**: INSERT en la tabla `productos`
- **Restricción**: Solo disponible para administradores autenticados (por implementar)

#### obtenerPortafolio(req, res)

- **Descripción**: Obtiene los trabajos destacados
- **Entrada**: Ninguna
- **Salida**: Array de proyectos con descripción, imágenes y tecnologías usadas
- **Base de datos**: SELECT de la tabla `portafolio`

#### crearPortafolio(req, res)

- **Descripción**: Agrega un nuevo trabajo al portafolio
- **Entrada**: `{ titulo, descripcion, tecnologias, imagen_url, fecha }`
- **Salida**: `{ success: boolean, id: number }`
- **Base de datos**: INSERT en la tabla `portafolio`

### Manejo de errores en el backend

Actualmente, el proyecto incluye:

- Try-catch para capturar errores en operaciones de base de datos
- Respuestas JSON consistentes con propiedades `success` y `message`
- Mensajes de error descriptivos para facilitar el debugging
- Logging básico en la consola del servidor

**Mejora pendiente**: Implementar un middleware centralizado de manejo de errores.

---

## 7. Descripción Detallada del Frontend

El frontend de DuotechBros está construido con HTML5, CSS3 y JavaScript vanilla, sin dependencias externas de framework, lo que lo hace ligero y fácil de mantener.

### Estructura de páginas públicas

#### inicio.html

- **Propósito**: Landing page institucional que presenta a DuotechBros
- **Secciones**: Encabezado, hero, servicios destacados, equipo, llamadas a acción
- **Estilos**: inicio.css
- **Funcionalidad**: Estática con navegación a otras páginas
- **Responsividad**: Diseñada para móvil, tablet y desktop

#### pedidos.html

- **Propósito**: Formulario para solicitar reparación de dispositivos
- **Campos del formulario**:
  - Nombre del cliente (texto, requerido)
  - Teléfono (número, requerido)
  - Email (email, requerido)
  - Modelo de celular (texto, requerido)
  - Descripción del problema (textarea, requerido)
- **Validación**: JavaScript en `Script_Pedidos.js`
- **Envío**: Fetch API a `POST /api/pedidos`
- **Respuesta**: Confirmación visual de éxito o error
- **Estilos**: pedidos.css

#### portafolio.html

- **Propósito**: Mostrar trabajos y proyectos realizados por la empresa
- **Contenido**: Galería de proyectos con descripciones
- **Carga de datos**: Puede ser estática o cargarse desde `GET /api/portafolio`
- **Estilos**: portafolio.css
- **Interactividad**: Enlaces a proyectos externos o modal con detalles

#### tienda.html

- **Propósito**: Catálogo de productos o servicios disponibles
- **Estado actual**: Estructura preparada, contenido estático
- **Funcionalidad futura**: Integración dinámica con `GET /api/productos`
- **Estilos**: tienda.css
- **Características planeadas**: Carrito, filtros, búsqueda

### Estructura de páginas administrativas (public/admin/)

#### login.html

- **Propósito**: Autenticación de usuarios administradores
- **Campos**: Usuario y contraseña
- **Validación**: JavaScript en `admin.js`
- **Envío**: Fetch API a `POST /api/login`
- **Redirección**: Al dashboard si las credenciales son correctas
- **Estilos**: admin.css
- **Seguridad**: Las contraseñas se validan en el servidor

#### dashboard.html

- **Propósito**: Panel principal para administradores
- **Funcionalidad**: Menú de navegación a otros paneles admin
- **Estadísticas**: Contadores de pedidos, productos, portafolio (por implementar)
- **Información rápida**: Últimos pedidos, alertas importantes
- **Estilos**: admin.css

#### productos.html

- **Propósito**: Gestión del catálogo de productos
- **Funcionalidades**:
  - Listar todos los productos
  - Crear nuevo producto
  - Editar producto existente
  - Eliminar producto
- **API utilizada**: GET/POST/PUT/DELETE `/api/productos`
- **Campos del producto**: nombre, descripción, precio, imagen
- **Estilos**: admin.css

#### portafolio.html

- **Propósito**: Gestión de trabajos y proyectos del portafolio
- **Funcionalidades**:
  - Listar todos los trabajos
  - Agregar nuevo trabajo
  - Editar trabajo existente
  - Eliminar trabajo
- **API utilizada**: GET/POST/PUT/DELETE `/api/portafolio`
- **Campos del trabajo**: título, descripción, tecnologías, imágenes, fecha
- **Estilos**: admin.css

#### pedidos.html (admin)

- **Propósito**: Visualización y gestión de pedidos recibidos
- **Funcionalidades**:
  - Listar todos los pedidos recibidos
  - Ver detalles completos de cada pedido
  - Actualizar estado del pedido (nuevo, en progreso, completado)
  - Agregar notas internas
  - Eliminar pedido
- **API utilizada**: GET/POST/PUT/DELETE `/api/pedidos`
- **Campos mostrados**: nombre cliente, teléfono, email, modelo, descripción, estado, fecha
- **Filtros**: Por estado, por fecha, por cliente
- **Estilos**: admin.css

### Archivos JavaScript

#### Script_Pedidos.js

**Ubicación**: `public/js/Script_Pedidos.js`

**Responsabilidades**:

- Manejo del formulario de solicitud de reparación
- Validación de campos en el navegador
- Envío de datos mediante Fetch API
- Manejo de respuestas exitosas y errores
- Retroalimentación visual al usuario (alertas, mensajes de éxito)

**Funciones principales**:

- `validarFormulario()`: Verifica que todos los campos cumplan los requisitos
- `enviarPedido()`: Realiza la solicitud POST a `/api/pedidos`
- `mostrarMensaje()`: Muestra confirmación o error al usuario
- `limpiarFormulario()`: Vacía los campos después del envío

**Eventos**:

- Submit del formulario: Valida y envía
- Change en campos: Validación en tiempo real
- Focus/Blur: Estilos dinámicos

#### admin.js

**Ubicación**: `public/admin/admin.js`

**Responsabilidades**:

- Autenticación de administradores (login/logout)
- Gestión de sesión del usuario
- Comunicación con endpoints de API
- Renderizado dinámico de listas y formularios
- Validación de datos de entrada
- Manejo de errores y notificaciones

**Funciones principales**:

- `autenticar()`: Valida credenciales contra `/api/login`
- `cargarPedidos()`: Obtiene y muestra la lista de pedidos
- `cargarProductos()`: Obtiene y muestra el catálogo
- `cargarPortafolio()`: Obtiene y muestra los trabajos
- `crearProducto()`: Envía nuevo producto a la API
- `editarProducto()`: Actualiza producto existente
- `eliminarProducto()`: Borra producto de la base de datos
- `verificarSesion()`: Comprueba si el usuario sigue autenticado
- `cerrarSesion()`: Limpia datos locales y redirige a login

**Almacenamiento**:

- Usa `localStorage` para guardar token de sesión (pendiente implementar JWT)
- Guarda datos temporales en variables globales

### Archivos CSS

#### normalize.css

- Reset de estilos por defecto del navegador
- Asegura consistencia entre navegadores (Chrome, Firefox, Safari, Edge)
- No debe ser modificado (es una librería estándar)

#### pie_encabezado.css

- Estilos compartidos del encabezado (header) de todas las páginas públicas
- Contiene: Logo, menú de navegación, estilos de enlace
- Estilos del pie de página (footer): Enlaces, información de contacto
- Reutilizado en: inicio.html, pedidos.html, portafolio.html, tienda.html

#### inicio.css

- Estilos específicos de inicio.html
- Secciones hero, servicios, testimonios, galería
- Animaciones y efectos visuales

#### pedidos.css

- Estilos del formulario de solicitud de reparación
- Estilos de campos, botones, validación visual
- Mensajes de éxito/error
- Responsividad móvil

#### portafolio.css

- Estilos de la galería de trabajos
- Grid o flexbox para mostrar proyectos
- Efectos hover sobre tarjetas
- Modal para detalles del proyecto

#### tienda.css

- Estilos del catálogo de productos
- Tarjetas de producto con imagen, nombre, precio
- Carrito (estructura preparada)
- Filtros y búsqueda (preparado)

#### admin.css

- Estilos del panel administrativo completo
- Barra lateral con menú de navegación
- Tablas de datos con acciones (editar, eliminar)
- Formularios de alta y edición
- Botones de acción (guardar, cancelar, eliminar)
- Estilos de login
- Dashboard y estadísticas

---

## 8. Base de Datos

El proyecto utiliza SQLite, una base de datos local embebida que no requiere servidor separado.

### Archivo de base de datos

- **Ubicación**: `duotechbros.db` en la raíz del proyecto
- **Creación**: Automática al iniciar el servidor si no existe
- **Tamaño típico**: Menor a 1 MB para operaciones normales
- **Backup**: Se recomienda hacer copias periódicas

### Tablas de la base de datos

#### Tabla: pedidos

Almacena las solicitudes de reparación recibidas desde el formulario público.

```sql
CREATE TABLE pedidos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre_cliente TEXT NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT NOT NULL,
  modelo_celular TEXT NOT NULL,
  descripcion_problema TEXT NOT NULL,
  estado TEXT DEFAULT 'nuevo',
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  notas TEXT
);
```

**Campos**:

- `id`: Identificador único (generado automáticamente)
- `nombre_cliente`: Nombre de quien solicita la reparación
- `telefono`: Número de contacto del cliente
- `email`: Email del cliente para contacto
- `modelo_celular`: Modelo del dispositivo a reparar
- `descripcion_problema`: Descripción detallada del problema
- `estado`: nuevo, en progreso, completado, cancelado
- `fecha_creacion`: Cuándo se creó el pedido
- `fecha_actualizacion`: Última modificación
- `notas`: Observaciones internas del equipo de reparación

#### Tabla: productos

Catálogo de productos o servicios disponibles.

```sql
CREATE TABLE productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio REAL NOT NULL,
  imagen_url TEXT,
  categoria TEXT,
  disponibilidad BOOLEAN DEFAULT 1,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Campos**:

- `id`: Identificador único
- `nombre`: Nombre del producto o servicio
- `descripcion`: Descripción detallada
- `precio`: Precio en pesos
- `imagen_url`: URL o ruta de la imagen del producto
- `categoria`: Categoría (accesorios, servicios, repuestos)
- `disponibilidad`: True si está disponible, False si agotado
- `fecha_creacion`: Cuándo se agregó el producto

#### Tabla: portafolio

Trabajos y proyectos destacados del portafolio.

```sql
CREATE TABLE portafolio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  tecnologias TEXT,
  imagen_url TEXT,
  url_externo TEXT,
  fecha TEXT,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Campos**:

- `id`: Identificador único
- `titulo`: Nombre del proyecto
- `descripcion`: Descripción del proyecto
- `tecnologias`: Lista de tecnologías usadas (JSON o texto separado por comas)
- `imagen_url`: URL de la imagen representativa
- `url_externo`: Enlace al proyecto o portafolio externo
- `fecha`: Fecha de realización del proyecto
- `fecha_creacion`: Cuándo se agregó al portafolio

#### Tabla: admin

Usuarios administradores del sistema.

```sql
CREATE TABLE admin (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email TEXT,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  activo BOOLEAN DEFAULT 1
);
```

**Campos**:

- `id`: Identificador único
- `usuario`: Nombre de usuario (único)
- `password`: Contraseña (debe encriptarse con bcryptjs)
- `email`: Email del administrador
- `fecha_creacion`: Cuándo se creó la cuenta
- `activo`: True si la cuenta está habilitada

**Usuario por defecto**:

- Usuario: `admin`
- Contraseña: `admin123`

### Acceso a la base de datos: database.js

El archivo `src/database/database.js` gestiona la conexión y operaciones de base de datos.

**Responsabilidades**:

- Importar better-sqlite3
- Crear o conectar a `duotechbros.db`
- Crear las tablas si no existen
- Insertar datos por defecto (usuario admin)
- Exportar la instancia de base de datos para uso en controladores

**Funciones de utilidad**:

- `conectar()`: Establece la conexión
- `crearTablas()`: Crea la estructura si es primera vez
- `cerrar()`: Cierra la conexión

---

## 9. Guía de Instalación y Configuración

### Requisitos previos

Asegúrate de tener instalado:

- Node.js
- npm

### Instalación de dependencias

Desde la raíz del proyecto, ejecuta:

```bash
npm install
```

Esto instalará las dependencias declaradas en package.json, incluyendo Express, CORS y better-sqlite3.

### Ejecutar el proyecto localmente

Para iniciar el servidor backend y poder probar la aplicación, ejecuta:

```bash
npm run dev
```

O de forma equivalente:

```bash
node src/server.js
```

El servidor quedará disponible en:

- http://localhost:3000

### Abrir la aplicación en el navegador

El proyecto sirve los archivos estáticos desde `public/`. Puedes abrir la página principal con:

- http://localhost:3000/inicio.html

Las demás páginas están disponibles en:

- http://localhost:3000/pedidos.html
- http://localhost:3000/portafolio.html
- http://localhost:3000/tienda.html

### Acceder al panel de administración

Para acceder al área administrativa, abre en tu navegador:

- http://localhost:3000/admin/login.html

Utiliza las siguientes credenciales de desarrollo:

- **Usuario**: admin
- **Contraseña**: admin123

Una vez autenticado, serás redirigido al dashboard desde donde podrás acceder a:

- http://localhost:3000/admin/dashboard.html (panel principal)
- http://localhost:3000/admin/productos.html (gestión de productos)
- http://localhost:3000/admin/portafolio.html (gestión de portafolio)
- http://localhost:3000/admin/pedidos.html (gestión de pedidos)

### Probar el formulario de pedidos

1. Abre la página de pedidos en el navegador.
2. Completa el formulario con datos válidos.
3. Envía la solicitud.
4. Si todo está correcto, el pedido se almacenará en la base de datos local.

### Probar la API de pedidos

También puedes probar la API directamente con una herramienta como Postman o curl.

#### Crear un pedido

```bash
curl -X POST http://localhost:3000/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{"nombre_cliente":"Juan Perez","telefono":"3764123456","email":"juan@email.com","modelo_celular":"Samsung S23","descripcion_problema":"Pantalla rota"}'
```

#### Obtener pedidos

```bash
curl http://localhost:3000/api/pedidos
```

#### Obtener productos

```bash
curl http://localhost:3000/api/productos
```

#### Obtener trabajos del portafolio

```bash
curl http://localhost:3000/api/portafolio
```

#### Iniciar sesión de administrador

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"admin","password":"admin123"}'
```

### Base de datos

La base de datos se crea automáticamente en el archivo:

- duotechbros.db

Al iniciar el servidor se verifica o crea la base de datos y las tablas `pedidos`, `productos`, `portafolio` y `admin`. Si no existe el usuario administrador inicial, se crea con las credenciales de desarrollo `admin` / `admin123`.

---

## 10. Guía de Uso

### Flujo de usuario regular (público)

1. Accede a http://localhost:3000/inicio.html
2. Navega por las secciones: Inicio, Portafolio, Tienda, Pedidos
3. En la sección de Pedidos, completa el formulario con tus datos
4. El sistema valida los datos y los envía al servidor
5. Recibes confirmación de que tu solicitud fue registrada
6. El equipo de DuotechBros revisa el pedido en el panel administrativo

### Flujo de usuario administrador

1. Accede a http://localhost:3000/admin/login.html
2. Ingresa las credenciales:
   - Usuario: `admin`
   - Contraseña: `admin123`
3. Eres redirigido al dashboard
4. Desde aquí puedes:
   - Ver todos los pedidos recibidos
   - Cambiar el estado de los pedidos
   - Agregar notas a los pedidos
   - Gestionar el catálogo de productos
   - Actualizar el portafolio de trabajos
5. Todas las operaciones se guardan inmediatamente en la base de datos

### Probar el formulario de pedidos

1. Abre la página de pedidos en el navegador: http://localhost:3000/pedidos.html
2. Completa el formulario con datos válidos:
   - Nombre: cualquier nombre
   - Teléfono: número valido formato 10 dígitos
   - Email: dirección email válida
   - Modelo: nombre del dispositivo
   - Descripción: describir el problema
3. Envía la solicitud haciendo clic en "Enviar"
4. Si todo está correcto, verás un mensaje de confirmación
5. El pedido se almacenará automáticamente en la base de datos

### Probar la API directamente

Puedes usar cualquier herramienta API como Postman, insomnia, o curl desde la terminal.

#### Crear un pedido

```bash
curl -X POST http://localhost:3000/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_cliente":"Juan Perez",
    "telefono":"3764123456",
    "email":"juan@email.com",
    "modelo_celular":"Samsung S23",
    "descripcion_problema":"Pantalla rota"
  }'
```

#### Obtener todos los pedidos

```bash
curl http://localhost:3000/api/pedidos
```

Respuesta esperada:

```json
[
  {
    "id": 1,
    "nombre_cliente": "Juan Perez",
    "telefono": "3764123456",
    "email": "juan@email.com",
    "modelo_celular": "Samsung S23",
    "descripcion_problema": "Pantalla rota",
    "estado": "nuevo",
    "fecha_creacion": "2026-09-14 10:30:00",
    "notas": null
  }
]
```

#### Obtener productos

```bash
curl http://localhost:3000/api/productos
```

#### Obtener portafolio

```bash
curl http://localhost:3000/api/portafolio
```

#### Autenticar como administrador

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "usuario":"admin",
    "password":"admin123"
  }'
```

Respuesta esperada:

```json
{
  "success": true,
  "mensaje": "Login exitoso"
}
```

---

## 11. Flujo de Datos del Sistema

### Diagrama de flujo del formulario de pedidos

```
Usuario abre pedidos.html
        ↓
Completa el formulario
        ↓
Hace clic en "Enviar"
        ↓
Script_Pedidos.js valida campos
        ↓
Si hay error: muestra mensaje ❌
Si es válido: continúa ↓
        ↓
Fetch envía datos a POST /api/pedidos
        ↓
Express recibe en app.js
        ↓
Ruta /api/pedidos llama a pedidos.routes.js
        ↓
pedidos.controller.crearPedido() procesa
        ↓
database.js ejecuta INSERT en tabla pedidos
        ↓
SQLite almacena el registro
        ↓
Controlador devuelve { success: true, id: 123 }
        ↓
Script_Pedidos.js recibe respuesta
        ↓
Muestra confirmación al usuario ✓
```

### Diagrama de flujo del panel administrativo

```
Admin accede a /admin/login.html
        ↓
Ingresa usuario y contraseña
        ↓
admin.js valida campos
        ↓
Fetch envía a POST /api/login
        ↓
pedidos.controller.login() verifica credenciales
        ↓
Si coinciden: { success: true }
Si no: { success: false }
        ↓
Si éxito: redirige a /admin/dashboard.html
Si falla: muestra error
        ↓
Dashboard.html carga admin.js
        ↓
admin.js llama a cargarPedidos()
        ↓
Fetch obtiene GET /api/pedidos
        ↓
Datos se muestran en tabla HTML
```

### Ciclo completo de creación de producto

```
Admin en /admin/productos.html
        ↓
Completa formulario de nuevo producto
        ↓
Envía datos: POST /api/productos
        ↓
crearProducto() en controlador
        ↓
INSERT en tabla productos
        ↓
Retorna { success: true, id: nuevo_id }
        ↓
admin.js recibe confirmación
        ↓
Recarga la lista de productos
        ↓
Producto aparece en tabla
        ↓
Admin puede editar o eliminar
```

---

## 12. Control de Versiones y Ramas

El proyecto utiliza Git para control de versiones.

### Rama principal: main

La rama `main` contiene el código estable en producción. No se debe pushear directamente aquí.

### Ramas de desarrollo: Franco

Se está utilizando la rama `Franco` para desarrollo activo de nuevas funcionalidades.

**Comandos útiles**:

```bash
# Ver rama actual
git branch

# Cambiar a rama Franco
git checkout Franco

# Crear nueva rama desde Franco
git checkout -b feature/nombre-funcionalidad

# Ver historial de commits
git log --oneline

# Ver cambios sin commitear
git status

# Agregar archivos para commit
git add .

# Realizar commit
git commit -m "Descripción del cambio"

# Pushear cambios
git push origin Franco
```

### Flujo recomendado de desarrollo

1. Crea una rama nueva desde `Franco` para cada funcionalidad
2. Realiza tus cambios y commits
3. Cuando termines, haz push a la rama
4. Solicita un Pull Request (PR) hacia `Franco`
5. Revisa los cambios y fusiona cuando esté listo
6. Borra la rama local y remota después de fusionar

---

## 13. Extensión y Desarrollo Futuro

### Cómo agregar nuevos endpoints de API

1. Abre `src/routes/pedidos.routes.js`
2. Define una nueva ruta: `router.get('/nuevo-endpoint', pedidos.miNuevaFuncion)`
3. Abre `src/controllers/pedidos.controller.js`
4. Implementa la función `miNuevaFuncion(req, res)`
5. Prueba con curl o Postman
6. Actualiza este README con documentación

### Cómo agregar una nueva página pública

1. Crea `public/nueva-pagina.html` con estructura HTML
2. Crea `public/css/nueva-pagina.css` con estilos
3. Crea `public/js/nueva-pagina.js` si necesita interactividad
4. Agrega enlace en el encabezado (pie_encabezado.html)
5. Prueba que la página se sirve correctamente
6. Documenta en este README

### Cómo agregar una nueva página administrativa

1. Crea `public/admin/nueva-seccion.html`
2. Implementa funciones en `public/admin/admin.js`
3. Agrega menu en `dashboard.html`
4. Crea o usa endpoints en `/api`
5. Prueba autenticación y permisos
6. Documenta funcionalidad

### Mejoras de seguridad recomendadas

1. **JWT (JSON Web Tokens)**:
   - Reemplazar almacenamiento de sesión en localStorage
   - Token en cabecera Authorization
   - Verificación en cada solicitud

2. **Encriptación de contraseñas**:
   - Usar bcryptjs para hashear contraseñas
   - Ya está en package.json, solo necesita implementación

3. **Validación de lado del servidor**:
   - Validar todos los campos en el controlador
   - Sanitizar entrada para prevenir inyecciones SQL

4. **HTTPS**:
   - En producción, usar certificados SSL/TLS
   - Redirigir HTTP a HTTPS

5. **Rate limiting**:
   - Limitar número de solicitudes por IP/usuario
   - Prevenir ataques de fuerza bruta

### Extensiones potenciales del proyecto

- **Integración de pasarela de pago**: Stripe, PayPal, MercadoPago
- **Envío de emails**: Notificaciones a clientes y administradores
- **SMS**: Alertas por WhatsApp o SMS
- **Reportes**: Exportar pedidos a PDF o Excel
- **Gráficos**: Dashboard con estadísticas visuales
- **Multi-idioma**: Soporte para English y Português
- **Búsqueda avanzada**: Filtros y ordenamiento en admin
- **Historial de cambios**: Auditoría de modificaciones

---

## 14. Resolución de Problemas Comunes

### El servidor no inicia

**Problema**: `Error: connect ECONNREFUSED`

**Soluciones**:

1. Verifica que Node.js esté instalado: `node --version`
2. Verifica que npm esté instalado: `npm --version`
3. Instala dependencias: `npm install`
4. Asegúrate de estar en la carpeta correcta: `Proyecto_DuotechBros/`
5. Intenta en puerto diferente modificando `server.js`

### Base de datos corrupta

**Problema**: Errores al crear/leer datos

**Soluciones**:

1. Elimina `duotechbros.db` de la raíz del proyecto
2. Reinicia el servidor con `npm run dev`
3. La base de datos se recrearáautomáticamente
4. Los datos anteriores se perderán (hacer backup primero)

### Las páginas admin no cargan

**Problema**: Errores en consola del navegador

**Verificaciones**:

1. Abre la consola del navegador (F12)
2. Verifica errores en la pestaña "Console"
3. Verifica que la URL sea correcta: `http://localhost:3000/admin/login.html`
4. Verifica que admin.js esté correctamente enlazado en el HTML
5. Verifica que el servidor esté corriendo

### CORS error

**Problema**: `No 'Access-Control-Allow-Origin' header`

**Solución**:

- Esto está configurado en `app.js`
- Si persiste, asegúrate que CORS esté habilitado
- Verifica que la URL del frontend sea http://localhost:3000

### Formulario no envía datos

**Problema**: Datos no llegan al servidor

**Verificaciones**:

1. Abre consola del navegador (F12)
2. Ve a Network y busca la solicitud POST
3. Verifica que el request contenga los datos correctos
4. Verifica que el servidor responda con 200 OK
5. Revisa `Script_Pedidos.js` para errores de validación

### Datos no se guardan en base de datos

**Problema**: Crear pedido devuelve success pero no aparece en lista

**Verificaciones**:

1. Verifica que la tabla exista: `duotechbros.db` debe tener tabla `pedidos`
2. Verifica permisos de archivo en `duotechbros.db`
3. Verifica logs del servidor para errores SQL
4. Intenta eliminar la base de datos y recrearla

---

## 15. Contribuciones y Mejoras Futuras

### Contribuyentes actuales

- Franco
- Mariano

### Roadmap de desarrollo

#### Fase 1 (Completamiento CRUD)

- [ ] Completar operaciones CRUD en productos
- [ ] Completar operaciones CRUD en portafolio
- [ ] Completar operaciones CRUD en pedidos
- [ ] Implementar eliminación lógica en lugar de física

#### Fase 2 (Seguridad y autenticación)

- [ ] Implementar JWT
- [ ] Encriptar contraseñas con bcryptjs
- [ ] Roles de usuario (admin, supervisor, etc.)
- [ ] Permisos granulares

#### Fase 3 (Funcionalidades avanzadas)

- [ ] Reportes y estadísticas
- [ ] Exportación de datos (PDF, Excel)
- [ ] Notificaciones por email
- [ ] Integración de pagos

#### Fase 4 (Optimización y escalabilidad)

- [ ] Migraciones de base de datos con mejor-versionado
- [ ] Caché con Redis
- [ ] Compresión y minificación de assets
- [ ] Deployment en servidor

### Cómo contribuir

1. Fork del repositorio
2. Crea una rama para tu feature: `git checkout -b feature/nombre`
3. Realiza tus cambios y commits descriptivos
4. Push a tu rama: `git push origin feature/nombre`
5. Abre un Pull Request con descripción detallada
6. Espera revisión y aprobación
7. Tu código se fusiona a `Franco` y luego a `main`

### Estándares de código

- **Nombres descriptivos**: Variables, funciones y archivos con nombres claros
- **Comentarios**: Explicar lógica compleja
- **Indentación**: 2 o 4 espacios consistentemente
- **Convenciones**: camelCase para variables, PascalCase para clases
- **Documentación**: Actualizar README y comentarios en código

---

## Última actualización

Este README se actualizó para reflejar la totalidad del proyecto DuotechBros. Incluye descripción completa de:

- Toda la arquitectura (frontend, backend, base de datos)
- Detalles de implementación de cada componente
- Guías completas de instalación, configuración y uso
- Flujos de datos del sistema
- Resolución de problemas comunes
- Roadmap de desarrollo futuro

El documento se mantendrá actualizado conforme evolucione el proyecto.
