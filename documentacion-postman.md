# Guía de Pruebas de API con Postman - DuotechBros
Esta guía detalla cómo configurar y ejecutar pruebas exhaustivas sobre el backend de DuotechBros, validando la seguridad, la integridad de datos y los flujos principales del sistema.

## 1. Configuración del Entorno en Postman
Para que todas las pruebas funcionen correctamente, primero debemos configurar el entorno:

1. En Postman, ve a **Environments** -> **Create Environment**. Nómbralo `DuotechBros - Local`.
2. Agrega las siguientes variables:

| Variable      | Valor Inicial                 | Descripción                 |
|---------------|-------------------------------|-----------------------------|
| `base_url`    | `http://localhost:3000/api`   | URL base del backend.       |
| `admin_token` | *(vacío)*                     | Se guardará automáticamente al hacer login. |
| `user_token`  | *(vacío)*                     | Se guardará al verificar un usuario. |
| `producto_id` | *(vacío)*                     | Se guardará al crear un producto. |
| `pedido_id`   | *(vacío)*                     | Se guardará al hacer checkout. |

1. Arriba a la derecha, en el desplegable, selecciona **`DuotechBros - Local`**.
2. Asegúrate de tener el servidor Node corriendo (`npm run dev`) y la base de datos MySQL activa.

---

## 2. Pruebas del Sitio Público y Seguridad Básica
**1. Configuración Pública (Validación F-10)**

- **Método:** `GET` -> `{{base_url}}/configuracion`
- **Prueba:** Enviar. El código debe ser `200 OK`. Verificar en el Body que **NO** aparezca la propiedad `email_admin` (esto evita exponer correos internos).

---

## 3. Flujo de Administrador y Validaciones (F-09)
**1. Login Admin**

- **Método:** `POST` -> `{{base_url}}/login`
- **Body (JSON):** `{"usuario": "admin", "password": "tu_contraseña"}`
- **Script (Tests):**

javascript

```
const response = pm.response.json();
if (response.success) pm.environment.set("admin_token", response.token);
```
- **Prueba de Bloqueo (F-05):** Intentar loguearse con contraseña incorrecta 5 veces. Al 6to intento (incluso con la correcta), debe arrojar `401` indicando cuenta bloqueada por 15 minutos.
**2. Crear Producto**

- **Método:** `POST` -> `{{base_url}}/admin/productos`
- **Auth:** Bearer Token `{{admin_token}}`
- **Body (JSON):** `{"nombre": "Producto Test", "precio": 150.50, "stock": 10}`
- **Script (Tests):**

javascript

```
const response = pm.response.json();
if (response.success) pm.environment.set("producto_id", response.id);
```
- **Prueba de Validación (F-09):** Intentar crear un producto con `"precio": -10` o `"stock": -5`. El sistema debe rechazarlo con `400 Bad Request`.

---

## 4. Flujo de Usuario, Carrito y Checkout Transaccional (F-08)
**1. Registro y Verificación**

- **Método 1:** `POST` -> `{{base_url}}/usuarios/registro` (Body: `{"usuario": "prueba", "email": "prueba@test.com", "password": "123456"}`)
- **Obtener código:** Revisar la consola de Node.js (modo desarrollo) para ver el código de 6 dígitos.
- **Método 2:** `POST` -> `{{base_url}}/usuarios/verificar-codigo` (Body con el email y el código obtenido).
- **Script (Tests):** Guardar el `response.token` en `user_token`.
**2. Agregar al Carrito**

- **Método:** `POST` -> `{{base_url}}/usuarios/carrito/agregar`
- **Auth:** Bearer Token `{{user_token}}`
- **Body (JSON):** `{"producto_id": {{producto_id}}, "cantidad": 2}`
**3. Enviar Pedido (Checkout Transaccional)**

- **Método:** `POST` -> `{{base_url}}/usuarios/carrito/enviar-pedido`
- **Auth:** Bearer Token `{{user_token}}`
- **Script (Tests):**

javascript

```
const response = pm.response.json();
if (response.success) pm.environment.set("pedido_id", response.pedido_id);
```
- **Verificación en DB:** Validar que el stock del producto bajó, se creó el pedido y la tabla `carrito` quedó vacía.

---

## 5. Pruebas de Seguridad Avanzada y Revocación (F-06, F-07)
**1. Revocación de Token al cambiar contraseña (F-06)**

- **Paso 1:** Llamar a `GET {{base_url}}/usuarios/perfil` con el `{{user_token}}` (Debe dar `200 OK`).
- **Paso 2:** Llamar a `PUT {{base_url}}/usuarios/perfil/password` con Body `{"password_actual": "123456", "password_nueva": "654321", "password_confirmar": "654321"}`.
- **Paso 3:** Volver a llamar al `GET /perfil` usando el mismo token viejo. **Resultado:** Debe dar `401 Unauthorized` (Sesión invalidada).
**2. Anulación de Pedido y Restauración de Stock (F-07)**

- **Método:** `DELETE` -> `{{base_url}}/admin/pedidos/{{pedido_id}}`
- **Auth:** Bearer Token `{{admin_token}}`
- **Verificación en DB:** El pedido pasa a estado `cancelado` (no se borra de la base de datos). El stock del producto vuelve a estar en 10. *(Nota: Si el pedido estaba completado, NO devuelve stock).*

---
**Observaciones para el Profesor:**

- Las rutas de envío de correos (`/registro`, `/recuperar-password`) tienen un `Rate Limit` de 5 peticiones por hora. Si se supera, Postman devolverá `429 Too Many Requests`.
- Para probar múltiples veces, se puede reiniciar el servidor Node (`Ctrl+C` y `npm run dev`) para limpiar el caché de memoria del Rate Limit.
