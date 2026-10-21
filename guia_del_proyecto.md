# Guía de desarrollo y operación - DuotechBros

Esta guía describe la estructura y el funcionamiento de la versión actual del proyecto. El backend utiliza MySQL, no SQLite, y está implementado con módulos ES (ESM) de Node.js. La aplicación sirve sus archivos web desde `public/` y ofrece una API Express bajo `/api`.

## 1. Requisitos y preparación

- Node.js y npm.
- MySQL disponible localmente. El flujo habitual del proyecto usa XAMPP; también puede usarse otra instalación compatible de MySQL.
- (Opcional) Credenciales SMTP para enviar correos de forma real.

Configura en un archivo `.env` las variables siguientes. No agregues credenciales reales al repositorio.

| Variable                  | Propósito                                  | Valor de ejemplo                         |
| ------------------------- | ------------------------------------------ | ---------------------------------------- |
| `PORT`                    | Puerto HTTP del backend                    | `3000`                                   |
| `DB_HOST`                 | Host MySQL                                 | `localhost`                              |
| `DB_PORT`                 | Puerto MySQL                               | `3306`                                   |
| `DB_USER`                 | Usuario MySQL                              | `root`                                   |
| `DB_PASSWORD`             | Contraseña MySQL                           | Vacía en la plantilla                    |
| `DB_NAME`                 | Base utilizada por la aplicación           | `duotechbros`                            |
| `SMTP_HOST`               | Host SMTP; vacío activa modo de desarrollo | Vacío                                    |
| `SMTP_PORT`               | Puerto SMTP                                | `587`                                    |
| `SMTP_USER` / `SMTP_PASS` | Credenciales SMTP                          | Vacías en la plantilla                   |
| `SMTP_FROM`               | Remitente mostrado en los mensajes         | `DuotechBros <no-reply@duotechbros.com>` |

No agregues `.env` al control de versiones ni compartas sus secretos. El `.gitignore` ya lo excluye.

## 2. Instalar e iniciar

1. Inicia el servicio MySQL desde XAMPP o tu administrador de base de datos.
2. Instala las dependencias e inicia el servidor:

```bash
npm install
npm run dev
```

`npm run dev` ejecuta `node server.js`. No existe un script `npm start` configurado actualmente. El backend usa `PORT` o `3000` por defecto y está disponible en `http://localhost:3000`.

Al arrancar, `server.js` carga `.env`, crea la base MySQL si no existe, establece un pool de conexiones, inicializa las tablas y valores iniciales y luego importa `src/app.js` e inicia Express. El orden es importante porque la aplicación obtiene el pool de conexiones al cargarse. El backend usa `import`/`export` de ESM; los imports locales deben incluir la extensión `.js`. La base de datos no es un archivo del repositorio: queda gestionada por el servidor MySQL configurado.

Para detener el proceso, usa `Ctrl+C` en la terminal del servidor. No hay recarga automática del backend; reinícialo tras cambiar código del servidor. Para cambios de frontend, vuelve a cargar la página.

## 3. Abrir el sitio

Con el servidor Node iniciado, abre:

- Sitio público: `http://localhost:3000/` o `http://localhost:3000/index.html`.
- Login de usuarios: `http://localhost:3000/user/login.html`.
- Login administrativo: `http://localhost:3000/admin/login.html`.

Express publica `public/` como raíz web; por eso las rutas públicas no incluyen el prefijo `/public`.

## 4. Base de datos y datos de demostración

El esquema se crea desde `src/models/schema.model.js`. Las tablas principales son:

- `usuarios`: cuentas del sitio y hashes de contraseña.
- `admin`: cuentas del panel administrativo.
- `productos`: catálogo, precio, categoría, stock e imágenes.
- `portafolio`: trabajos, fechas, categoría e imágenes.
- `pedidos`: solicitudes de reparación y compras, estado, notas y presupuesto.
- `pedido_items`: productos y subtotales asociados a las compras.
- `carrito`: artículos por cuenta de usuario.
- `codigos_verificacion`: códigos temporales para registro y recuperación de contraseña.
- `configuracion`: información de contacto, redes, horarios y opciones del sitio.

La inicialización usa `CREATE TABLE IF NOT EXISTS` y agrega las columnas de imágenes si faltan en tablas existentes. En una base nueva también inserta valores de configuración y un administrador inicial.

El catálogo y el portafolio se administran desde las páginas del panel. El registro de usuario se realiza desde `/user/login.html`; en modo SMTP de desarrollo, el código de verificación aparece en la consola del backend.

## 5. Páginas y flujos de la aplicación

### Sitio público

- `/` o `/index.html`: presentación, servicios e información de contacto.
- `/tienda.html`: catálogo dinámico y acceso a la compra.
- `/portafolio.html`: trabajos y reparaciones cargados desde la API.
- `/pedidos.html`: formulario de reparación; requiere una sesión de usuario.

El nombre de marca se administra desde la configuración del sitio y se aplica a los textos marcados en las páginas públicas y de usuario.

El catálogo y el portafolio admiten una imagen principal y hasta cuatro imágenes adicionales. El script reutilizable `public/js/carrusel.js` presenta varias imágenes. El menú público tiene comportamiento adaptable para pantallas pequeñas.

### Cuenta del usuario

- `/user/login.html`: registro, verificación del código, inicio de sesión, recuperación de contraseña e inicio de sesión con email.
- `/user/perfil.html`: datos de cuenta, cambio de email y contraseña y baja de cuenta.
- `/user/carrito.html`: consulta y edición de cantidades, eliminación de artículos y confirmación de compra.
- `/user/pedidos.html`: historial de compras y reparaciones, búsqueda, filtros, detalle, acciones disponibles y exportación PDF de pedidos de los últimos seis meses. El nombre de marca configurado se utiliza en el documento.

Al enviar la compra, el sistema comprueba disponibilidad, registra cabecera y detalle, descuenta stock y limpia el carrito en una transacción MySQL. Si una validación falla, la operación no debe dejar una compra parcialmente aplicada.

### Panel administrativo

- `/admin/login.html`: acceso administrativo.
- `/admin/dashboard.html`: estadísticas de pedidos, productos más vendidos, ventas y alertas de stock. El filtro temporal permite consultar todo el tiempo, hoy, la última semana o el último mes; los gráficos muestran ventas agrupadas por día en períodos filtrados y por mes en la vista de todo el tiempo. Los gráficos utilizan Chart.js.
- `/admin/pedidos.html`: pedidos de reparación con búsqueda, filtros por fecha y estado, paginación, ordenamiento, actualización de estado/notas/presupuesto, eliminación y exportación CSV.
- `/admin/compras.html`: compras realizadas desde el carrito, con búsqueda, filtros por fecha y estado, paginación y visualización del detalle/estado.
- `/admin/productos.html`: alta, edición y eliminación de productos; gestiona precios, categorías, existencias e imágenes.
- `/admin/portafolio.html`: alta, edición y eliminación de trabajos e imágenes.
- `/admin/configuracion.html`: contacto, redes sociales, horarios, avisos y email administrativo.
- `/admin/perfil.html`: consulta y cambio de usuario y contraseña del administrador.

El nombre de marca configurado se aplica a las etiquetas `.admin-marca` del panel. `public/js/admin.js` comparte la carga de configuración y el helper `filtrarPorRangoTiempo`, utilizado por dashboard, pedidos y compras. El botón “Limpiar” restablece los filtros de búsqueda, estado y fecha en las tablas. Las exportaciones CSV administrativas usan la marca en el nombre del archivo; la exportación PDF de pedidos también la muestra en el documento y en su nombre.

Las vistas protegidas requieren autenticación administrativa. El panel y el sitio público cuentan con diseños adaptables a pantallas pequeñas.

## 6. Organización del código

```text
server.js                  Carga configuración, inicializa MySQL e inicia Express
src/
  app.js                   Configura Express, CORS, archivos estáticos y routers (ESM)
  config/                  Conexión a MySQL, autenticación y correo
  controllers/             Validación de solicitudes y respuestas HTTP
  middlewares/             Protección de rutas de usuario y administración
  models/                  Consultas y esquema de datos MySQL
  routes/                  Endpoints de la API
  services/                Flujos de autenticación, carrito y correo
  utils/                   Utilidades compartidas, incluida la firma de tokens
public/
  index.html               Inicio del sitio
  pedidos.html             Formulario de reparación
  portafolio.html          Portafolio público
  tienda.html              Tienda pública
  admin/                   Páginas del panel administrativo
  user/                    Páginas de cuenta, carrito e historial
  assets/                  Imágenes de la aplicación
  css/                     Estilos del sitio, usuario y panel
  js/                      Funciones de interfaz e integración con la API
package.json               Dependencias y comando de ejecución
```

El frontend no utiliza un framework SPA. El backend usa ESM, exportaciones nombradas y funciones flecha; sus imports locales incluyen `.js`. `src/app.js` monta tres routers: `pedidos.routes.js` bajo `/api`, `admin.routes.js` bajo `/api/admin` y `usuarios.routes.js` bajo `/api/usuarios`. Las rutas y reglas de negocio se separan en controladores, servicios y modelos.

## 7. API HTTP

Las solicitudes y respuestas usan JSON. Las rutas protegidas reciben `Authorization: Bearer <token>`. El proyecto firma y verifica sus propios tokens en `src/utils/token.util.js`; no usa JWT.

### Rutas generales

| Método | Ruta                       | Acceso y función                                                |
| ------ | -------------------------- | --------------------------------------------------------------- |
| `POST` | `/api/login`               | Público; inicia sesión administrativa con usuario y contraseña. |
| `GET`  | `/api/pedidos`             | Lista pedidos; admite `?tipo=producto` para compras.            |
| `POST` | `/api/pedidos`             | Requiere usuario autenticado; crea solicitud de reparación.     |
| `GET`  | `/api/pedidos/:id/detalle` | Requiere administrador; devuelve pedido e ítems.                |
| `GET`  | `/api/productos`           | Lista el catálogo.                                              |
| `GET`  | `/api/portafolio`          | Lista trabajos del portafolio.                                  |
| `GET`  | `/api/configuracion`       | Devuelve configuración pública del sitio.                       |

### Administración: `/api/admin` (todas requieren token administrativo)

| Método                  | Ruta                                                  | Función                                          |
| ----------------------- | ----------------------------------------------------- | ------------------------------------------------ |
| `POST`, `PUT`, `DELETE` | `/api/admin/productos` y `/api/admin/productos/:id`   | Crear, actualizar y eliminar productos.          |
| `POST`, `PUT`, `DELETE` | `/api/admin/portafolio` y `/api/admin/portafolio/:id` | Crear, actualizar y eliminar trabajos.           |
| `PUT`                   | `/api/admin/pedidos/:id`                              | Cambiar estado.                                  |
| `PUT`                   | `/api/admin/pedidos/:id/notas`                        | Cambiar notas internas.                          |
| `PUT`                   | `/api/admin/pedidos/:id/presupuesto`                  | Cambiar presupuesto.                             |
| `DELETE`                | `/api/admin/pedidos/:id`                              | Eliminar pedido.                                 |
| `PUT`                   | `/api/admin/configuracion`                            | Actualizar configuración permitida del sitio.    |
| `GET`                   | `/api/admin/estadisticas?rango=todos`                 | Datos agregados para los gráficos; admite `todos`, `hoy`, `semana` y `mes` (por defecto: `todos`). |
| `GET`                   | `/api/admin/perfil`                                   | Consultar perfil administrativo.                 |
| `PUT`                   | `/api/admin/perfil/usuario`                           | Cambiar nombre de usuario administrativo.        |
| `PUT`                   | `/api/admin/perfil/password`                          | Cambiar contraseña administrativa.               |

### Usuarios: `/api/usuarios`

| Método   | Ruta                                  | Acceso y función                                                            |
| -------- | ------------------------------------- | --------------------------------------------------------------------------- |
| `POST`   | `/api/usuarios/registro`              | Inicia registro y envía/expone en modo de desarrollo un código.             |
| `POST`   | `/api/usuarios/verificar-codigo`      | Verifica el código de registro de seis dígitos.                             |
| `POST`   | `/api/usuarios/reenviar-codigo`       | Reenvía el código de registro.                                              |
| `POST`   | `/api/usuarios/recuperar-password`    | Inicia la recuperación de contraseña por email.                             |
| `POST`   | `/api/usuarios/restablecer-password`  | Verifica el código y establece una contraseña nueva.                        |
| `POST`   | `/api/usuarios/login`                 | Inicia sesión de usuario mediante email y contraseña.                       |
| `GET`    | `/api/usuarios/perfil`                | Requiere usuario; consulta el perfil.                                       |
| `PUT`    | `/api/usuarios/perfil/password`       | Requiere usuario; cambia contraseña.                                        |
| `PUT`    | `/api/usuarios/perfil/email`          | Requiere usuario; cambia email tras confirmar contraseña.                   |
| `DELETE` | `/api/usuarios/perfil`                | Requiere usuario; da de baja la cuenta tras confirmar contraseña.           |
| `GET`    | `/api/usuarios/pedidos`               | Requiere usuario; lista su historial.                                       |
| `GET`    | `/api/usuarios/pedidos/:id`           | Requiere usuario; consulta el detalle propio.                               |
| `PUT`    | `/api/usuarios/pedidos/:id/cancelar`  | Requiere usuario; solicita cancelar un pedido propio.                       |
| `POST`   | `/api/usuarios/pedidos/:id/repetir`   | Requiere usuario; repone en el carrito artículos disponibles de una compra. |
| `POST`   | `/api/usuarios/carrito/agregar`       | Requiere usuario; agrega un producto.                                       |
| `GET`    | `/api/usuarios/carrito`               | Requiere usuario; consulta el carrito.                                      |
| `PUT`    | `/api/usuarios/carrito/:id`           | Requiere usuario; cambia cantidad.                                          |
| `DELETE` | `/api/usuarios/carrito/:id`           | Requiere usuario; elimina un artículo.                                      |
| `DELETE` | `/api/usuarios/carrito`               | Requiere usuario; vacía el carrito.                                         |
| `POST`   | `/api/usuarios/carrito/enviar-pedido` | Requiere usuario; crea compra desde el carrito.                             |

La API no tiene una especificación OpenAPI publicada. Sus rutas y métodos se documentan en las tablas anteriores y se implementan en los routers de `src/routes/`.

Para `hoy`, `semana` y `mes`, la API limita los agregados al período solicitado y devuelve las ventas agrupadas por día. Con `rango=todos`, las ventas se agrupan por mes y el gráfico presenta los últimos seis meses. El dashboard aplica el mismo rango a las tarjetas de pedidos y compras mediante el helper compartido del frontend.

## 8. Correo electrónico

`src/config/email.config.js` habilita SMTP cuando están configurados `SMTP_HOST` y `SMTP_USER`; `SMTP_PORT`, `SMTP_PASS` y `SMTP_FROM` completan la conexión. Con `SMTP_HOST` vacío, el backend no envía mensajes reales: imprime códigos de verificación y contenidos de correo en la consola, útil para desarrollo. Al configurar `email_admin` desde el panel, el administrador puede recibir avisos de compra y reparación junto con los correos destinados al cliente. El nombre de marca configurado se usa en los asuntos y plantillas de los correos, con `DuotechBros` como valor de respaldo.

Los códigos de verificación tienen vencimiento de diez minutos. Mantén las credenciales SMTP solo en el `.env` local.

## 9. Seguridad y cuentas iniciales

En una base nueva se genera el usuario administrativo `admin` con contraseña `admin123`. Cámbiala desde `/admin/perfil.html` inmediatamente y no uses estas credenciales en un entorno compartido.

El secreto de firma está codificado actualmente en `src/config/auth.config.js`; no se lee desde `.env`. Antes de cualquier despliegue, debe cambiarse y trasladarse a una configuración privada. `.env` y dependencias instaladas están excluidos del repositorio, pero esto no sustituye la revisión de secretos codificados ni una configuración segura de producción.

## 10. Pruebas y solución de problemas

- `npm test` es un marcador y termina con error; todavía no existe una suite automatizada.
- **No conecta a MySQL:** verifica que MySQL esté iniciado y que host, puerto, usuario, contraseña y nombre de base coincidan con `.env`.
- **No llega el código o correo:** sin SMTP configurado, consulta la consola del backend; con SMTP, verifica host, puerto y credenciales.
- **Cambios del servidor no aparecen:** detén y vuelve a iniciar `npm run dev`; los cambios del navegador requieren recarga.
- **Catálogo vacío:** crea productos desde la sección de administración y verifica la conexión a MySQL.
