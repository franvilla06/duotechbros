// carga las variables de entorno antes de importar módulos que las necesitan
import 'dotenv/config';
import { inicializarBaseDatos } from './src/config/database.js';

// inicializa la base de datos y levanta el servidor
const arrancar = async () => {
    try {
        // prepara la base de datos y sus tablas antes de cargar la aplicación
        await inicializarBaseDatos();

        // carga la aplicación después de inicializar el pool que obtiene al importarse
        const { app } = await import('./src/app.js');

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error al arrancar el servidor:', error);
        process.exit(1);
    }
};

arrancar();