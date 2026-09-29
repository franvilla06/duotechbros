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
- `/admin/dashboard.html`: estadísticas generales, estados de pedidos, últimos pedidos y alertas de stock bajo.
- `/admin/pedidos.html`: búsqueda, filtros por estado, actualización de estados, eliminación y exportación a CSV.
- `/admin/productos.html`: alta, edición y eliminación de productos, con categoría, precio y stock.
- `/admin/portafolio.html`: alta, edición y eliminación de trabajos, con tipo de reparación e imagen.

Las tablas del panel permiten ordenar sus columnas y navegar mediante paginación. El sidebar también muestra una notificación cuando existen pedidos pendientes.

Credenciales de desarrollo:

- Usuario: `admin`
- Contraseña: `admin123`

Estas credenciales deben cambiarse antes de utilizar el sistema en producción.

## Estructura básica

```text
public/                 Páginas, estilos, recursos y scripts del frontend
public/assets/          Imágenes y recursos multimedia
public/admin/           Páginas del panel administrativo
public/user/            Páginas del área de usuarios
src/app.js              Configuración de Express
server.js               Inicio del servidor
src/routes/             Rutas de la API
src/controllers/        Manejo de solicitudes HTTP
src/config/             Conexión a SQLite y configuración
src/models/             Consultas de datos por entidad
src/services/           Flujos de negocio e integraciones
src/middlewares/        Autenticación y validaciones HTTP
src/utils/              Funciones auxiliares reutilizables
package.json            Dependencias y comandos del proyecto
```

## Funcionamiento general

1. El usuario completa el formulario de pedidos en el sitio público.
2. `public/js/Script_Pedidos.js` valida y envía los datos a `POST /api/pedidos`.
3. Express recibe la solicitud y el controlador la guarda en SQLite.
4. El administrador inicia sesión y recibe un token para acceder a las operaciones protegidas.
5. Desde el panel puede consultar y administrar pedidos, productos y trabajos del portafolio.

El formulario público valida nombre, email, teléfono, modelo y descripción antes de enviar el pedido. El dashboard obtiene los datos de las tres entidades principales y muestra totales, estados de pedidos, stock bajo y los cinco pedidos más recientes.

## Rutas principales de la API

```text
POST /api/pedidos       Registrar un pedido
GET  /api/pedidos       Consultar pedidos
GET  /api/productos     Consultar productos
GET  /api/portafolio    Consultar trabajos del portafolio
POST /api/login         Iniciar sesión administrativa
```

Las operaciones administrativas requieren autenticación y se encuentran agrupadas bajo `/api/admin`:

```text
POST   /api/admin/productos       Crear producto
PUT    /api/admin/productos/:id   Actualizar producto
DELETE /api/admin/productos/:id   Eliminar producto
POST   /api/admin/portafolio      Crear trabajo
PUT    /api/admin/portafolio/:id  Actualizar trabajo
DELETE /api/admin/portafolio/:id  Eliminar trabajo
PUT    /api/admin/pedidos/:id     Actualizar estado del pedido
DELETE /api/admin/pedidos/:id     Eliminar pedido
```

El acceso administrativo utiliza `sessionStorage` en el navegador y envía el token mediante `Authorization: Bearer <token>`. Las contraseñas se almacenan con `bcryptjs`.

## Desarrollo

Los cambios del frontend se realizan dentro de `public/`. La lógica del servidor se organiza en `src/`, separando rutas, controladores y base de datos. Después de modificar el proyecto, reiniciar el servidor y probar tanto el sitio público como el panel administrativo.
