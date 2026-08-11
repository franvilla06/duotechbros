# DuotechBros - Proyecto Web y Gestión de Pedidos

## 1. Descripción General del Proyecto

Este proyecto corresponde a una solución web para la empresa DuotechBros, orientada a mostrar sus servicios, fortalecer su presencia digital y permitir la gestión básica de pedidos de reparación de celulares y accesorios.

La aplicación combina un sitio institucional estático con un backend ligero para recibir solicitudes de clientes y almacenarlas en una base de datos local. Su objetivo principal es ofrecer una plataforma sencilla, funcional y fácil de mantener para que la empresa pueda presentar su propuesta de valor y captar solicitudes de contacto o reparación desde la web.

### Arquitectura general

El proyecto sigue una arquitectura simple de tres capas:

- Frontend: páginas HTML, estilos CSS y JavaScript vanilla para la interfaz del usuario.
- Backend: servidor Node.js con Express para exponer APIs y servir archivos estáticos.
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

## 3. Estado Actual / Logros Alcanzados

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

### Logros alcanzados

- Se consolidó una estructura organizada del proyecto para continuar escalando el desarrollo.
- Se integró la lógica frontend-backend de forma básica pero funcional.
- Se estableció la base para futuras mejoras como panel administrativo, edición de pedidos y catálogo dinámico.
- El sistema ya permite registrar solicitudes reales del cliente en una base de datos local.

### Estado general

El proyecto está listo para ser probado localmente y extendido con nuevas funcionalidades. Actualmente funciona como una plataforma web orientada a operaciones básicas de captación de clientes y almacenamiento de pedidos.

---

## 4. Estructura y Secciones del Proyecto

La estructura del repositorio es la siguiente:

```text
Proyecto_DuotechBros/
├── Backend/
│   ├── database.js
│   └── server.js
├── css/
│   ├── inicio.css
│   ├── normalize.css
│   ├── pedidos.css
│   ├── pie_encabezado.css
│   ├── portafolio.css
│   └── tienda.css
├── html/
│   ├── inicio.html
│   ├── pedidos.html
│   ├── portafolio.html
│   └── tienda.html
├── img/
│   ├── Bienvenida.svg
│   └── Equipo duotechbros.jpg
├── js/
│   └── Script_Pedidos.js
├── duotechbros.db
├── package.json
├── package-lock.json
└── README.md
```

### Explicación de los componentes principales

#### Backend/

- database.js: inicializa la conexión a SQLite y crea la tabla pedidos si no existe.
- server.js: levanta el servidor Express, habilita CORS, sirve archivos estáticos y expone los endpoints de pedidos.

#### css/

Contiene los estilos de cada sección del sitio:

- inicio.css: estilos de la página principal.
- pedidos.css: estilos del formulario de reparación.
- portafolio.css: estilos de la sección de portafolio.
- tienda.css: estilos de la sección de tienda.
- pie_encabezado.css: estilos compartidos del encabezado y el pie de página.
- normalize.css: reset de estilos para compatibilidad entre navegadores.

#### html/

Contiene las páginas del sitio:

- inicio.html: landing page institucional.
- pedidos.html: formulario para solicitar reparación o contacto.
- portafolio.html: presentación de proyectos destacados.
- tienda.html: estructura de la sección de tienda.

#### js/

- Script_Pedidos.js: gestiona el formulario de pedidos, valida los campos y envía los datos al backend.

#### img/

Incluye imágenes visuales para la identidad del negocio, como la foto del equipo y una imagen de bienvenida.

---

## 5. Instrucciones de Uso y Configuración

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
node Backend/server.js
```

El servidor quedará disponible en:

- http://localhost:3000

### Abrir la aplicación en el navegador

Debido a que el proyecto sirve archivos estáticos desde la raíz, puedes abrir la página principal con:

- http://localhost:3000/html/inicio.html

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

### Base de datos

La base de datos se crea automáticamente en el archivo:

- duotechbros.db

Y al iniciar el servidor se verifica o crea la tabla pedidos.

---

## Siguientes pasos recomendados

Para continuar el desarrollo del proyecto, se recomienda avanzar en las siguientes mejoras:

- Implementar un panel de administración para visualizar y actualizar pedidos.
- Crear una tienda dinámica con productos cargados desde base de datos o JSON.
- Añadir autenticación para usuarios administrativos.
- Mejorar la experiencia visual con componentes más modernos.
- Agregar manejo de imágenes y catálogo de servicios.

Este README se actualizó para reflejar el estado real del repositorio y su funcionamiento actual.