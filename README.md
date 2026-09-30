# DuotechBros

Aplicación web para presentar los servicios de DuotechBros, recibir pedidos de reparación y administrar productos, trabajos del portafolio y pedidos desde un panel web.

## Funcionalidades

- Sitio público con inicio, catálogo de productos, portafolio y formulario de reparación.
- Registro e inicio de sesión de usuarios, consulta de productos y carrito de compras.
- Conversión del carrito en pedido, con validación y descuento de stock en una transacción.
- Panel de administración con dashboard y gestión de pedidos, productos y portafolio.
- Búsqueda, filtros, ordenamiento, paginación y exportación a CSV en las tablas del panel.
- Persistencia local con SQLite.

## Tecnologías

- Node.js y Express 5.
- HTML, CSS y JavaScript sin framework en el navegador.
- SQLite con `better-sqlite3`.
- `bcryptjs` para almacenar contraseñas con hash y CORS para el servidor.

## Requisitos e inicio

Se requiere Node.js y npm. Desde la raíz del repositorio:

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). Para iniciar el servidor con el comando de producción configurado, usar `npm start`. Ambos comandos ejecutan `server.js`; `PORT` permite cambiar el puerto y, si no se define, se usa `3000`.

La base `duotechbros.db` se crea o actualiza automáticamente al iniciar el servidor. Consultar [guia_del_proyecto.md](guia_del_proyecto.md) para ver la estructura, páginas, API y detalles de desarrollo.

## Seguridad

El usuario inicial del panel es `admin` y su contraseña inicial es `admin123`. Son credenciales de desarrollo: deben cambiarse antes de exponer la aplicación. La clave de firma de los tokens también está configurada en el código del proyecto.

## Pruebas

El script `npm test` todavía es un marcador y no ejecuta una suite de pruebas.

## Autores

- Franco
- Mariano
