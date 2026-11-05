# DuotechBros

Aplicación web para presentar los servicios de DuotechBros, recibir solicitudes de reparación y ofrecer una tienda de accesorios con cuentas de usuario. Incluye un panel interno para administrar pedidos, productos, trabajos del portafolio, compras y datos de contacto.

## Descripción y arquitectura

El proyecto es una aplicación web cliente-servidor. El frontend está hecho con HTML, CSS y JavaScript sin framework; el backend se ejecuta en Node.js con Express y módulos ES (ESM); y la persistencia se realiza en MySQL mediante `mysql2`. Express sirve la carpeta `public/` y expone la API bajo `/api`.

El servidor carga la configuración desde `.env`, inicializa la base de datos y su esquema y, solo después, importa la aplicación e inicia el servidor HTTP. Los módulos locales del backend se importan con extensión `.js`, usan exportaciones nombradas y mantienen las funciones en formato flecha. Los controladores atienden las solicitudes, los servicios coordinan los flujos de negocio y los modelos ejecutan consultas SQL.

## Funcionalidades

### Sitio público y usuarios

- Inicio institucional con información de la empresa, servicios, contacto y navegación adaptable a pantallas pequeñas.
- Páginas de términos y condiciones y política de privacidad, enlazadas desde el sitio.
- Avisos destacados configurables desde el panel y mensajes visuales compartidos en las distintas secciones.
- Catálogo de accesorios alimentado desde la API, con imágenes múltiples y carrusel de imágenes.
- Portafolio de trabajos realizados, también con soporte para varias imágenes y carrusel.
- Registro de usuarios en dos pasos con código de verificación enviado por correo, inicio de sesión con email y recuperación de contraseña mediante código.
- Las cuentas se bloquean durante 15 minutos después de cinco intentos fallidos; el contador se limpia al expirar el bloqueo, iniciar sesión correctamente o restablecer la contraseña.
- Perfil de usuario para consultar o cambiar email y contraseña, o solicitar la baja. Al eliminar una cuenta, los datos personales asociados a sus pedidos se anonimizan y el historial se conserva.
- Formulario de reparación asociado a la cuenta autenticada y sección de historial personal.
- Carrito de compras; al confirmar la compra se leen y bloquean los artículos y productos dentro de una transacción, se valida el stock, se registran los precios vigentes, se actualizan las existencias y se vacía el carrito.
- Historial de compras y reparaciones con detalle, filtros por tipo y estado, búsqueda, cancelación o repetición de compras cuando corresponde, y exportación de pedidos recientes a PDF.
- La marca del sitio se configura desde el panel y se refleja en los textos públicos y de usuario, además de los correos transaccionales y documentos exportados.
- Correos de confirmación de reparaciones y compras; el email administrativo configurado puede recibir notificaciones de ambos flujos.

### Administración

- Inicio de sesión administrativo y panel con estadísticas, gráficos filtrables por período, pedidos recientes y alertas de stock.
- Gestión de productos y trabajos del portafolio, incluidas hasta cuatro imágenes adicionales además de la imagen principal.
- Carga de hasta cinco imágenes por producto o trabajo mediante Cloudinary; también se admiten las direcciones de imagen que permite la interfaz.
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
- **Almacenamiento de imágenes:** Cloudinary para las imágenes cargadas desde el panel administrativo.
- **Autenticación y correo:** `bcryptjs` para hashes de contraseñas, tokens Bearer implementados por el proyecto y la API de Brevo para el envío de correos.
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
│   ├── css/
│   │   ├── admin/            Estilos del panel administrativo
│   │   ├── site/             Estilos de las páginas públicas
│   │   ├── user/             Estilos de las páginas de usuario
│   │   └── shared/           Variables y normalización compartidas
│   ├── js/
│   │   ├── admin/            Scripts del panel administrativo
│   │   ├── site/             Scripts del sitio público
│   │   ├── user/             Scripts de cuenta y carrito
│   │   └── shared/           Configuración y scripts compartidos
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
├── server.js                 Inicialización de base de datos y servidor
├── guia_del_proyecto.md      Guía de desarrollo, operación y rutas de API
└── documentacion-postman.md  Pruebas manuales de API con Postman
```

El árbol muestra los componentes que ejecutan la aplicación: interfaz web, API, acceso a datos y dependencias. No incluye configuración personal del editor, colecciones locales de herramientas ni archivos temporales.

Express sirve `public/` como raíz estática. Los recursos del frontend se solicitan con rutas como `/css/admin/admin.css` y `/js/user/usuario-carrito.js`; al agregar o mover un recurso, actualiza sus referencias en las páginas HTML.

## Instalación y ejecución local

### Requisitos

- Node.js y npm.
- Un servidor MySQL local. En el flujo documentado se utiliza XAMPP y phpMyAdmin.
- Para cargar archivos de imagen desde el panel: credenciales de Cloudinary.
- Para enviar correos reales: una clave de API de Brevo y un remitente verificado. Sin la clave de API, el servicio simula los envíos y escribe los mensajes/códigos en la consola del backend.

### Preparar configuración y dependencias

En la raíz del repositorio, crea `.env` con la configuración de MySQL y el secreto de autenticación. `DB_PASSWORD` debe estar definida aunque sea vacía, como suele ocurrir con la instalación local predeterminada de XAMPP. `JWT_SECRET` es obligatorio y debe tener al menos 32 caracteres; el proyecto firma sus propios tokens y no usa el formato JWT. `ADMIN_PASSWORD` permite establecer la contraseña del administrador inicial. Las credenciales de Cloudinary se necesitan para cargar imágenes desde el panel; Brevo es opcional y habilita el envío real de correos.

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=duotechbros
JWT_SECRET=reemplazar_por_un_secreto_aleatorio_de_32_caracteres_o_mas
ADMIN_PASSWORD=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
BREVO_API_KEY=
SMTP_FROM_EMAIL=
```

Completa los valores de Cloudinary y Brevo solo con credenciales propias; no compartas ni subas `.env` al repositorio. `SMTP_FROM_EMAIL` es el nombre histórico de la variable: el envío se realiza por la API HTTP de Brevo, no por una conexión SMTP. Para MySQL local puedes usar `localhost`, puerto `3306`, usuario `root` y base `duotechbros`, ajustando host, puerto y contraseña a tu instalación.

Instala dependencias e inicia MySQL desde XAMPP. Luego ejecuta:

```bash
npm install
npm run dev
```

`npm run dev` y `npm start` ejecutan `node server.js`. El servidor escucha en el puerto definido por `PORT` o, si no se define, en `3000`. XAMPP debe tener activo MySQL; Apache no es necesario porque Express sirve el sitio. Al arrancar, el servidor crea la base de datos si falta, crea las tablas del esquema y carga valores iniciales de configuración.

Abre [http://localhost:3000](http://localhost:3000). Para detener el servidor, usa `Ctrl+C` en la terminal donde corre.

Para comprobar las funciones de catálogo y portafolio, inicia sesión en el panel administrativo y carga productos o trabajos. El registro de usuarios se completa con un código de seis dígitos; en modo de desarrollo, revisa la consola del backend para obtenerlo.

## Configuración de correo

Configura `BREVO_API_KEY` y `SMTP_FROM_EMAIL` para activar el envío mediante la API HTTP de Brevo. `SMTP_FROM_EMAIL` debe ser un remitente verificado; el nombre de la variable no implica que se use SMTP. En Render u otro alojamiento, define ambas variables en la configuración del servicio. Si falta `BREVO_API_KEY`, no se envían correos reales y los mensajes se muestran en la consola del backend. El correo que recibe notificaciones administrativas se configura desde el panel.

Para subir imágenes desde el panel, configura `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET`. Se aceptan JPEG, PNG, WEBP y GIF, con un máximo de cinco archivos de 2 MB cada uno por operación. La carga de archivos requiere esas credenciales; el servidor puede iniciar sin ellas si no se usan cargas a Cloudinary.

## Credenciales y seguridad

Cuando no existe ningún administrador, se crea el usuario `admin`. La contraseña se obtiene de `ADMIN_PASSWORD`; si no está definida, se genera aleatoriamente y se muestra una sola vez en la consola al iniciar el servidor. El secreto `JWT_SECRET` debe definirse en `.env` y mantenerse privado.

Las cuentas guardan hashes de contraseña con `bcryptjs`; los tokens propios expiran en 24 horas y las rutas protegidas validan su versión contra la base de datos. Al cambiar las credenciales, los tokens anteriores quedan invalidados. La baja de cuenta anonimiza nombre, teléfono, email y descripción personal de los pedidos vinculados antes de eliminar al usuario.

## Pruebas y documentación relacionada

- `npm test` no ejecuta pruebas: el script actual es solo un marcador que termina con error.
- [guia_del_proyecto.md](guia_del_proyecto.md) contiene el mapa funcional de páginas, la arquitectura, la configuración y las rutas de API.
- [documentacion-postman.md](documentacion-postman.md) describe los flujos de verificación manual de la API con Postman.

## Comportamiento actual

El backend usa módulos ES de Node.js. `server.js` inicializa MySQL antes de cargar `src/app.js`, que obtiene el pool de conexiones durante su inicialización. El esquema prepara las tablas y el administrador inicial, pero no inserta productos ni pedidos de demostración. En las páginas web, la marca y el aviso general se leen desde `/api/configuracion`; los términos y la política de privacidad están en `/terminos.html` y `/privacidad.html`. Los filtros temporales del dashboard, pedidos y compras admiten hoy, última semana, último mes y todo el tiempo; el dashboard agrupa las ventas por día para períodos acotados y por mes para todo el tiempo. El sitio y el panel se han adaptado a pantallas pequeñas.

## Autores

- Franco
- Mariano
