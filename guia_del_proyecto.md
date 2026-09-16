# Guía del proyecto DuotechBros

## Requisitos

- Node.js
- npm

## Instalación y ejecución

Desde la carpeta raíz del proyecto:

```bash
npm install
npm run dev
```

El servidor queda disponible en `http://localhost:3000`.

La base de datos SQLite se crea o actualiza automáticamente al iniciar el servidor. El archivo utilizado es `duotechbros.db`.

## Páginas principales

### Sitio público

- `/`: página de inicio.
- `/pedidos.html`: formulario para solicitar una reparación.
- `/portafolio.html`: trabajos y proyectos realizados.
- `/tienda.html`: productos o servicios disponibles.

### Panel administrativo

- `/admin/login.html`: acceso al panel.
- `/admin/dashboard.html`: página principal de administración.
- `/admin/pedidos.html`: consulta de pedidos.
- `/admin/productos.html`: gestión de productos.
- `/admin/portafolio.html`: gestión del portafolio.

Credenciales de desarrollo:

- Usuario: `admin`
- Contraseña: `admin123`

Estas credenciales deben cambiarse antes de utilizar el sistema en producción.

## Estructura básica

```text
public/                 Páginas, estilos, imágenes y scripts del frontend
public/admin/           Páginas del panel administrativo
src/app.js              Configuración de Express
src/server.js           Inicio del servidor
src/routes/             Rutas de la API
src/controllers/        Lógica de las solicitudes
src/database/           Conexión y configuración de SQLite
package.json            Dependencias y comandos del proyecto
```

## Funcionamiento general

1. El usuario completa el formulario de pedidos en el sitio público.
2. `public/js/Script_Pedidos.js` valida y envía los datos a `POST /api/pedidos`.
3. Express recibe la solicitud y el controlador la guarda en SQLite.
4. El administrador puede consultar los pedidos desde el panel.

## Rutas principales de la API

```text
POST /api/pedidos       Registrar un pedido
GET  /api/pedidos       Consultar pedidos
GET  /api/productos     Consultar productos
GET  /api/portafolio    Consultar trabajos del portafolio
POST /api/login         Iniciar sesión administrativa
```

Las operaciones administrativas adicionales se encuentran agrupadas bajo `/api/admin`.

## Desarrollo

Los cambios del frontend se realizan dentro de `public/`. La lógica del servidor se organiza en `src/`, separando rutas, controladores y base de datos. Después de modificar el proyecto, reiniciar el servidor y probar tanto el sitio público como el panel administrativo.
