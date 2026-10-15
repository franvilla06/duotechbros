# DuotechBros

Aplicación web para presentar los servicios de DuotechBros, recibir solicitudes de reparación y ofrecer una tienda de accesorios con cuentas de usuario. Incluye un panel interno para administrar pedidos, productos, trabajos del portafolio, compras y datos de contacto.

## Descripción y arquitectura

El proyecto es una aplicación web cliente-servidor. El frontend está hecho con HTML, CSS y JavaScript sin framework; el backend se ejecuta en Node.js con Express; y la persistencia se realiza en MySQL mediante `mysql2`. Express sirve la carpeta `public/` y expone la API bajo `/api`.

El servidor carga la configuración desde `.env`, inicializa la base de datos y su esquema y, solo después, inicia la aplicación HTTP. Los controladores atienden las solicitudes, los servicios coordinan los flujos de negocio y los modelos ejecutan consultas SQL.

## Funcionalidades

### Sitio público y usuarios

- Inicio institucional con información de la empresa, servicios, contacto y navegación adaptable a pantallas pequeñas.
- Catálogo de accesorios alimentado desde la API, con imágenes múltiples y carrusel de imágenes.
- Portafolio de trabajos realizados, también con soporte para varias imágenes y carrusel.
- Registro de usuarios en dos pasos con código de verificación enviado por correo, inicio de sesión con email y recuperación de contraseña mediante código.
- Perfil de usuario para consultar o cambiar email y contraseña, o solicitar la baja de la cuenta.
- Formulario de reparación asociado a la cuenta autenticada y sección de historial personal.
- Carrito de compras; al confirmar la compra se valida el stock, se crea el pedido y sus ítems, se actualizan las existencias y se vacía el carrito dentro de una transacción.
- Historial de compras y reparaciones con detalle, filtros por tipo y estado, búsqueda, cancelación o repetición de compras cuando corresponde, y exportación de pedidos recientes a PDF.
- Correos de confirmación de reparaciones y compras; también se puede notificar al administrador de las compras.

### Administración

- Inicio de sesión administrativo y panel con estadísticas, gráficos, pedidos recientes y alertas de stock.
- Gestión de productos y trabajos del portafolio, incluidas hasta cuatro imágenes adicionales además de la imagen principal.
- Gestión de pedidos de reparación y compras: consulta, filtros, cambios de estado, notas, presupuestos y eliminación.
- Búsqueda, ordenamiento, paginación y exportación CSV donde están disponibles en las tablas administrativas.
- Configuración de datos de contacto, redes, horarios y avisos del sitio.
- Perfil administrativo para cambiar usuario y contraseña.
- Interfaz adaptable a dispositivos móviles, incluido el menú público y el panel de administración.

## Tecnologías y dependencias

- **Entorno y servidor:** Node.js, Express 5 y CommonJS.
- **Frontend:** HTML5, CSS3 y JavaScript vanilla; no se utiliza un framework de interfaz.
- **Base de datos:** MySQL, normalmente ejecutado localmente con XAMPP; `mysql2` proporciona el cliente asíncrono con pool de conexiones.
- **Autenticación y correo:** `bcryptjs` para hashes de contraseñas, tokens Bearer implementados por el proyecto y `nodemailer` para SMTP.
- **Configuración y solicitudes:** `dotenv` para cargar `.env` y `cors` para habilitar solicitudes desde el origen local de desarrollo.
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

En la raíz del repositorio, configura las variables de entorno en `.env`: `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` y `SMTP_FROM`. Para una instalación MySQL local típica se pueden usar `localhost`, puerto `3306`, usuario `root` y base `duotechbros`; ajusta host, usuario y contraseña a tu instalación. No compartas ni subas `.env` al repositorio.

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

En una base nueva se crea el usuario administrativo `admin` con contraseña inicial `admin123`. Son credenciales de desarrollo: inicia sesión y cámbialas desde el perfil administrativo antes de cualquier uso compartido o despliegue. El secreto usado para firmar tokens está actualmente definido en `src/config/auth.config.js`, no en `.env`; debe reemplazarse y gestionarse fuera del código antes de publicar la aplicación.

Las cuentas de usuario guardan hashes de contraseña con `bcryptjs`; las rutas de usuario y administración usan middleware de autenticación. No expongas el servidor ni credenciales de desarrollo tal como están configurados en el repositorio.

## Pruebas y documentación relacionada

- `npm test` no ejecuta pruebas: el script actual es solo un marcador que termina con error.
- [guia_del_proyecto.md](guia_del_proyecto.md) contiene el mapa funcional de páginas, la arquitectura y las rutas de API.

## Cambios recientes

Los commits recientes de la rama incluyen mejoras responsive para el menú público y el panel administrativo, exportación PDF de la sección “Mis pedidos”, cierre de la confirmación de compra para volver al carrito, envío de correos informativos de compras y reparaciones, carrusel público y gestión de imágenes múltiples para productos y portafolio. El historial anterior también registra la migración de SQLite a MySQL, autenticación por email, verificación de registro por correo, recuperación de contraseña y gráficos del dashboard.

## Autores

- Franco
- Mariano
