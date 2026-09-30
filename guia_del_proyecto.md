# Guía del proyecto DuotechBros

## Requisitos

- Node.js
- npm

## Instalación y ejecución

Desde la raíz del repositorio:

```bash
npm install
npm run dev
```

El servidor queda disponible en `http://localhost:3000`. También se puede iniciar con `npm start`; ambos scripts ejecutan `server.js`. Para usar otro puerto, definir la variable de entorno `PORT` antes de iniciar el proceso.

La base de datos SQLite `duotechbros.db` está en la raíz. Al iniciar, el servidor crea las tablas que falten, aplica migraciones y crea el usuario administrador inicial si todavía no existe.

Para detener el servidor, enfocar la terminal donde se está ejecutando y presionar `Ctrl+C`. El proyecto no tiene recarga automática del backend: después de cambiar código de servidor hay que reiniciarlo. Los cambios de archivos estáticos se ven al volver a cargar la página.

## Páginas

### Sitio público

- `/`: página de inicio.
- `/pedidos.html`: formulario para solicitar una reparación.
- `/portafolio.html`: trabajos realizados.
- `/tienda.html`: catálogo de productos y acceso al carrito.

### Administración

- `/admin/login.html`: inicio de sesión del administrador.
- `/admin/dashboard.html`: totales, estados de pedidos, pedidos recientes y alertas de stock.
- `/admin/pedidos.html`: búsqueda, filtros, actualización de estado y notas, eliminación y exportación CSV.
- `/admin/productos.html`: alta, edición y eliminación de productos, incluyendo precio, categoría, stock e imagen.
- `/admin/portafolio.html`: alta, edición y eliminación de trabajos del portafolio.

Las tablas administrativas tienen ordenamiento y paginación. El menú muestra una notificación cuando hay pedidos pendientes.

### Usuarios

- `/user/login.html`: registro e inicio de sesión.
- `/user/carrito.html`: consulta y administración del carrito, y envío del pedido.

## Estructura del proyecto

```text
server.js                       Entrada del servidor HTTP
src/
	app.js                        Configuración de Express y montaje de rutas
	config/
		auth.config.js              Secreto usado para firmar tokens
		database.js                 Conexión SQLite y preparación inicial
	controllers/                  Validación HTTP y respuestas req/res
	middlewares/                  Autenticación de administrador y usuario
	models/                       Consultas SQLite y esquema de datos
	routes/                       Endpoints de la API
	services/                     Flujos de autenticación, base y carrito
	utils/                        Utilidades compartidas, como tokens
public/
	index.html                    Inicio del sitio
	admin/                        Vistas del panel administrativo
	user/                         Vistas de usuarios registrados
	assets/                       Imágenes y recursos multimedia
	css/                          Hojas de estilo
	js/                           Scripts del navegador
duotechbros.db                  Base de datos local generada/actualizada al iniciar
package.json                    Dependencias y comandos
```

## Funcionamiento

1. El frontend público carga contenido y realiza solicitudes a la API del mismo servidor.
2. El formulario de reparación envía sus datos a `POST /api/pedidos`.
3. El registro/login de usuarios usa `/api/usuarios`; los datos de contraseña se guardan con `bcryptjs`.
4. El usuario agrega productos al carrito y puede enviar su contenido como un pedido.
5. El envío del carrito valida el stock y, en una única transacción, crea el pedido y sus detalles, descuenta existencias y vacía el carrito.
6. El administrador inicia sesión en `POST /api/login`; las operaciones administrativas requieren el token de administrador.

## API

Las respuestas de lectura de pedidos, productos y portafolio devuelven listas JSON. Las rutas administrativas y de usuario protegidas esperan `Authorization: Bearer <token>`.

### Rutas públicas

| Método | Ruta                     | Función                                |
| ------ | ------------------------ | -------------------------------------- |
| `POST` | `/api/pedidos`           | Registrar una solicitud de reparación. |
| `GET`  | `/api/pedidos`           | Listar pedidos.                        |
| `GET`  | `/api/productos`         | Listar productos.                      |
| `GET`  | `/api/portafolio`        | Listar trabajos del portafolio.        |
| `POST` | `/api/login`             | Iniciar sesión administrativa.         |
| `POST` | `/api/usuarios/registro` | Registrar un usuario.                  |
| `POST` | `/api/usuarios/login`    | Iniciar sesión de usuario.             |

### Rutas administrativas protegidas

| Método   | Ruta                           | Función                       |
| -------- | ------------------------------ | ----------------------------- |
| `POST`   | `/api/admin/productos`         | Crear producto.               |
| `PUT`    | `/api/admin/productos/:id`     | Actualizar producto.          |
| `DELETE` | `/api/admin/productos/:id`     | Eliminar producto.            |
| `POST`   | `/api/admin/portafolio`        | Crear trabajo.                |
| `PUT`    | `/api/admin/portafolio/:id`    | Actualizar trabajo.           |
| `DELETE` | `/api/admin/portafolio/:id`    | Eliminar trabajo.             |
| `PUT`    | `/api/admin/pedidos/:id`       | Actualizar estado del pedido. |
| `PUT`    | `/api/admin/pedidos/:id/notas` | Actualizar notas del pedido.  |
| `DELETE` | `/api/admin/pedidos/:id`       | Eliminar pedido.              |

### Rutas de usuario protegidas

| Método   | Ruta                                  | Función                                                 |
| -------- | ------------------------------------- | ------------------------------------------------------- |
| `GET`    | `/api/usuarios/perfil`                | Consultar el perfil autenticado.                        |
| `POST`   | `/api/usuarios/carrito/agregar`       | Agregar un producto; recibe `producto_id` y `cantidad`. |
| `GET`    | `/api/usuarios/carrito`               | Consultar el carrito y su resumen.                      |
| `PUT`    | `/api/usuarios/carrito/:id`           | Cambiar cantidad; cantidad `0` elimina el item.         |
| `DELETE` | `/api/usuarios/carrito/:id`           | Eliminar un item.                                       |
| `DELETE` | `/api/usuarios/carrito`               | Vaciar el carrito.                                      |
| `POST`   | `/api/usuarios/carrito/enviar-pedido` | Crear un pedido a partir del carrito.                   |

El token del navegador se envía en el encabezado `Authorization`. La firma y verificación de tokens están en `src/utils/token.util.js`; el proyecto usa un mecanismo propio, no JWT.

## Credenciales y seguridad

La base de datos crea el administrador inicial `admin` con contraseña `admin123` si la cuenta no existe. Estas credenciales son solo para desarrollo y deben cambiarse antes de desplegar la aplicación. El secreto de firma está definido en `src/config/auth.config.js`; también debe reemplazarse y protegerse en un despliegue real.

## Desarrollo y pruebas

- El punto de entrada es `server.js`; `src/app.js` configura Express y sirve `public/`.
- Las consultas y el esquema están en `src/models/`; los controladores manejan HTTP y los servicios coordinan operaciones de negocio.
- La configuración de base de datos y el secreto de autenticación están en `src/config/`.
- `npm test` todavía no ejecuta pruebas: el script actual es un marcador.
- El archivo SQLite está excluido del control de versiones por `.gitignore`; los datos locales no se comparten al clonar el repositorio.
