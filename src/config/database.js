import mysql from 'mysql2/promise';
import { inicializarEsquema } from '../models/schema.model.js';

if (!process.env.DB_HOST || !process.env.DB_USER || process.env.DB_PASSWORD === undefined) {
    console.error('ERROR FATAL: Faltan variables de entorno para la base de datos.');
    console.error('Asegurate de configurar DB_HOST, DB_USER y DB_PASSWORD en tu archivo .env.');
    throw new Error('No se puede iniciar sin las credenciales requeridas de la base de datos.');
}

// define los parámetros de conexión con los valores del entorno
export const config = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'duotechbros',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4_unicode_ci',
    timezone: 'local',
    ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : undefined,
};

let pool = null; 

// crea la base de datos si aún no existe y cierra la conexión temporal
const crearBaseDeDatos = async () => {
    const conexionTemporal = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        ssl: config.ssl,
    });

    try {
        await conexionTemporal.query(
            `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
        console.log(`Base de datos "${config.database}" verificada/creada`);
    } finally {
        await conexionTemporal.end();
    }
};

// crea el pool de conexiones y comprueba que responda correctamente
const inicializarPool = async () => {
    await crearBaseDeDatos();

    pool = mysql.createPool(config);

    // verifica que una conexión del pool responda antes de continuar
    const conexion = await pool.getConnection();
    try {
        await conexion.ping();
        console.log('Conexion a MySQL establecida');
    } finally {
        conexion.release();
    }
};

// prepara la base de datos, el pool y el esquema de tablas
export const inicializarBaseDatos = async () => {
    await inicializarPool();
    await inicializarEsquema(pool);
    console.log('Base de datos lista');
};

// devuelve el pool una vez que fue inicializado
export const obtenerPool = () => {
    if (!pool) {
        throw new Error('El pool de conexiones no esta inicializado');
    }
    return pool;
};
