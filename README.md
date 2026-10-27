# DuotechBros

Aplicación web para presentar los servicios de DuotechBros, recibir solicitudes de reparación y ofrecer una tienda de accesorios con cuentas de usuario. Incluye un panel interno para administrar pedidos, productos, trabajos del portafolio, compras y datos de contacto.

## Descripción y arquitectura

El proyecto es una aplicación web cliente-servidor. El frontend está hecho con HTML, CSS y JavaScript sin framework; el backend se ejecuta en Node.js con Express y módulos ES (ESM); y la persistencia se realiza en MySQL mediante `mysql2`. Express sirve la carpeta `public/` y expone la API bajo `/api`.

El servidor carga la configuración desde `.env`, inicializa la base de datos y su esquema y, solo después, importa la aplicación e inicia el servidor HTTP. Los módulos locales del backend se importan con extensión `.js`, usan exportaciones nombradas y mantienen las funciones en formato flecha. Los controladores atienden las solicitudes, los servicios coordinan los flujos de negocio y los modelos ejecutan consultas SQL.

## Funcionalidades

### Sitio público y usuarios

- Inicio institucional con información de la empresa, servicios, contacto y navegación adaptable a pantallas pequeñas.
- Catálogo de accesorios alimentado desde la API, con imágenes múltiples y carrusel de imágenes.
- Portafolio de trabajos realizados, también con soporte para varias imágenes y carrusel.
- Registro de usuarios en dos pasos con código de verificación enviado por correo, inicio de sesión con email y recuperación de contraseña mediante código.
- Las cuentas se bloquean durante 15 minutos después de cinco intentos fallidos; el contador se limpia al expirar el bloqueo, iniciar sesión correctamente o restablecer la contraseña.
- Perfil de usuario para consultar o cambiar email y contraseña, o solicitar la baja. Al eliminar una cuenta, los datos personales asociados a sus pedidos se anonimizan y el historial se conserva.
- Formulario de reparación asociado a la cuenta autenticada y sección de historial personal.
- Carrito de compras; al confirmar la compra se leen y bloquean los artículos y productos dentro de una transacción, se valida el stock, se registran los precios vigentes, se actualizan las existencias y se vacía el carrito.
- Historial de compras y reparaciones con detalle, filtros por tipo y estado, búsqueda, cancelación o repetición de compras cuando corresponde, y exportación de pedidos recientes a PDF.
- La marca del sitio se configura desde el panel y se refleja en los textos públicos y de usuario, además de los correos transaccionales y documentos exportados.
- Correos de confirmación de reparaciones y compras; también se puede notificar al administrador de las compras.

### Administración

- Inicio de sesión administrativo y panel con estadísticas, gráficos filtrables por período, pedidos recientes y alertas de stock.
- Gestión de productos y trabajos del portafolio, incluidas hasta cuatro imágenes adicionales además de la imagen principal.
- Gestión de pedidos de reparación y compras: consulta, filtros por fecha y estado, cambios de estado, notas, presupuestos y cancelación. El borrado desde el panel anula el pedido conservando el historial; cancelar una compra completada no devuelve stock.
- Validación de precios y stock no negativos al crear o actualizar productos; el esquema incluye restricciones `CHECK` para instalaciones nuevas.
- Búsqueda, ordenamiento, paginación y exportación CSV con la marca actual. Los campos que podrían interpretarse como fórmulas se neutralizan al exportar.
- Configuración de la marca, datos de contacto, redes, horarios y avisos del sitio.
- La configuración pública no expone el email administrativo.
- Perfil administrativo para cambiar usuario y contraseña.
- Los tokens incluyen una versión de credenciales; al cambiar contraseña o usuario, las sesiones con la versión anterior quedan invalidadas.
- Interfaz adaptable a dispositivos móviles, incluido el menú público y el panel de administración.

## Tecnologías y dependencias

- **Entorno y servidor:** Node.js, Express 5 y módulos ES (ESM).
- **Frontend:** HTML5, CSS3 y JavaScript vanilla; no se utiliza un framework de interfaz.
- **Base de datos:** MySQL, normalmente ejecutado localmente con XAMPP; `mysql2` proporciona el cliente asíncrono con pool de conexiones.
- **Autenticación y correo:** `bcryptjs` para hashes de contraseñas, tokens Bearer implementados por el proyecto y `nodemailer` para SMTP.
- **Configuración, solicitudes y seguridad:** `dotenv` para cargar `.env`, `cors` para habilitar solicitudes desde el origen local de desarrollo y `express-rate-limit` para limitar solicitudes de envío de códigos y proteger el restablecimiento de contraseña.
- **Librerías frontend externas:** Font Awesome para iconos, Chart.js para gráficos del dashboard, jsPDF y jsPDF-AutoTable para exportar el historial del usuario a PDF.
- **Herramientas del proyecto:** npm para instalar dependencias y ejecutar el servidor; Git para el control de versiones.

Las versiones instaladas de las dependencias se declaran en `package.json` y se fijan para la instalación mediante `package-lock.json`. No hay una suite automatizada configurada actualmente.

## Estructura del repositorio

```text
.
├── public/                   Sitio y recursos servidos por Express
│   ├── admin/                Vistas del panel administrativo
│   ├── user/                 Vistas de cuenta, carrito e historial
│   ├── assets/               Imágenes del sitio
│   ├── css/                  Estilos públicos, de usuario y administración
│   ├── js/                   Scripts del frontend y configuración de API
│   └── *.html                Inicio, pedidos, tienda y portafolio
├── src/
│   ├── app.js                Configuración Express, CORS, archivos estáticos y rutas
│   ├── config/               Base de datos, autenticación y correo
│   ├── controllers/          Validación HTTP y respuestas de API
│   ├── middlewares/          Protección de rutas y autenticación
│   ├── models/               Consultas y esquema MySQL
│   ├── routes/               Rutas públicas, administrativas y de usuarios
│   ├── services/             Autenticación, carrito y correo
│   └── utils/                Utilidades compartidas, incluidos tokens
├── package.json              Dependencias y comandos npm
└── server.js                 Inicialización de base de datos y servidor
```

El árbol muestra los componentes que ejecutan la aplicación: interfaz web, API, acceso a datos y dependencias. No incluye configuración personal del editor, colecciones locales de herramientas ni archivos temporales.

## Instalación y ejecución local

### Requisitos

- Node.js y npm.
- Un servidor MySQL local. En el flujo documentado se utiliza XAMPP y phpMyAdmin.
- Para enviar correos reales: acceso a un servidor SMTP. Sin credenciales SMTP, el servicio de correo usa modo de desarrollo y escribe los mensajes/códigos en la consola del backend.

### Preparar configuración y dependencias

En la raíz del repositorio, configura las variables de entorno en `.env`: `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `ADMIN_PASSWORD` (opcional), `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` y `SMTP_FROM`. `JWT_SECRET` es obligatorio y debe tener al menos 32 caracteres; aunque el proyecto utiliza tokens propios y no el formato JWT, esa variable se usa para firmarlos. `ADMIN_PASSWORD` permite establecer la contraseña del administrador inicial. Para una instalación MySQL local típica se pueden usar `localhost`, puerto `3306`, usuario `root` y base `duotechbros`; ajusta host, usuario y contraseña a tu instalación. No compartas ni subas `.env` al repositorio.

Instala dependencias e inicia MySQL desde XAMPP. Luego ejecuta:

```bash
npm install
npm run dev
```

El único script de ejecución configurado es `npm run dev`, que ejecuta `node server.js`. El servidor escucha en el puerto definido por `PORT` o, si no se define, en `3000`. Al arrancar crea la base de datos si falta, crea las tablas del esquema y carga valores iniciales de configuración.

Abre [http://localhost:3000](http://localhost:3000). Para detener el servidor, usa `Ctrl+C` en la terminal donde corre.

Para comprobar las funciones de catálogo y portafolio, inicia sesión en el panel administrativo y carga productos o trabajos. El registro de usuarios se completa con un código de seis dígitos; en modo de desarrollo, revisa la consola del backend para obtenerlo.

## Configuración de correo

En `.env`, configura `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` y `SMTP_FROM` para activar el envío SMTP. El servicio considera que el modo real está habilitado si están definidos el host y el usuario SMTP. Si `SMTP_HOST` está vacío, no se envía correo real: los mensajes de verificación y confirmación se muestran en la consola. El email que recibe notificaciones administrativas se configura desde el panel, en la configuración del sitio.

## Credenciales y seguridad

Cuando no existe ningún administrador, se crea el usuario `admin`. La contraseña se obtiene de `ADMIN_PASSWORD`; si no está definida, se genera aleatoriamente y se muestra una sola vez en la consola al iniciar el servidor. El secreto `JWT_SECRET` debe definirse en `.env` y mantenerse privado.

Las cuentas guardan hashes de contraseña con `bcryptjs`; los tokens propios expiran en 24 horas y las rutas protegidas validan su versión contra la base de datos. Al cambiar las credenciales, los tokens anteriores quedan invalidados. La baja de cuenta anonimiza nombre, teléfono, email y descripción personal de los pedidos vinculados antes de eliminar al usuario.

## Pruebas y documentación relacionada

- `npm test` no ejecuta pruebas: el script actual es solo un marcador que termina con error.
- [guia_del_proyecto.md](guia_del_proyecto.md) contiene el mapa funcional de páginas, la arquitectura y las rutas de API.

## Comportamiento actual

El backend usa módulos ES de Node.js. `server.js` inicializa MySQL antes de cargar `src/app.js`, que obtiene el pool de conexiones durante su inicialización. En las páginas web, la marca se lee desde `/api/configuracion` y se refleja en los elementos preparados para mostrarla, los correos y los archivos exportados. Los filtros temporales del dashboard, pedidos y compras admiten hoy, última semana, último mes y todo el tiempo; el dashboard agrupa las ventas por día para períodos acotados y por mes para todo el tiempo.

## Autores

- Franco
- Mariano
