// cargar variables de entorno ANTES de cualquier otro require
require('dotenv').config();

const { inicializarBaseDatos } = require('./src/config/database');

// funcion principal para arrancar el servidor
// se inicializa la base de datos primero y despues se levanta express
async function arrancar() {
    try {
        // 1. inicializar base de datos (crea db, pool y tablas)
        await inicializarBaseDatos();

        // 2. importar la app DESPUES de inicializar el pool
        // (app.js usa obtenerPool() en su carga)
        const app = require('./src/app');

        const PORT = process.env.PORT || 3000;

        // 3. arrancar el servidor http
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error al arrancar el servidor:', error);
        process.exit(1);
    }
}

arrancar();