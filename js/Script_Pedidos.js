const form = document.getElementById('form-pedido');
const mensajeDiv = document.getElementById('mensaje');

form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita que recargue la página

    const datos = {
        nombre_cliente: document.getElementById('nombre_cliente').value,
        email: document.getElementById('email').value,
        telefono: document.getElementById('telefono').value,
        modelo_celular: document.getElementById('modelo_celular').value,
        descripcion_problema: document.getElementById('descripcion_problema').value
    };

    try {
        const respuesta = await fetch('http://localhost:3000/api/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            mensajeDiv.textContent = '✅ ¡Pedido enviado con éxito!';
            mensajeDiv.className = 'mensaje exito';
            form.reset(); // Limpia el formulario
        } else {
            mensajeDiv.textContent = '❌ Error: ' + resultado.error;
            mensajeDiv.className = 'mensaje error';
        }
    } catch (error) {
        mensajeDiv.textContent = '❌ No se pudo conectar con el servidor. ¿Está ejecutándose? (node backend/server.js)';
        mensajeDiv.className = 'mensaje error';
    }

    mensajeDiv.style.display = 'block';
    setTimeout(() => mensajeDiv.style.display = 'none', 500000);
});