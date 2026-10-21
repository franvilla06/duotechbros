import mysql from 'mysql2/promise';
import { inicializarEsquema } from '../models/schema.model.js';

// parametros de conexion leidos desde .env
export const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'duotechbros',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4_unicode_ci',
    timezone: 'local',
};

let pool = null;

// crea la base de datos si no existe
// se conecta sin especificar database para poder crearla
const crearBaseDeDatos = async () => {
    const conexionTemporal = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
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

// inicializa el pool de conexiones
// el pool maneja multiples conexiones de forma eficiente
const inicializarPool = async () => {
    await crearBaseDeDatos();

    pool = mysql.createPool(config);

    // verificar que la conexion funcione
    const conexion = await pool.getConnection();
    try {
        await conexion.ping();
        console.log('Conexion a MySQL establecida');
    } finally {
        conexion.release();
    }
};

// inicializa todo: base de datos, pool y esquema
export const inicializarBaseDatos = async () => {
    await inicializarPool();
    await inicializarEsquema(pool);
    console.log('Base de datos lista');
};

// devuelve el pool de conexiones
export const obtenerPool = () => {
    if (!pool) {
        throw new Error('El pool de conexiones no esta inicializado');
    }
    return pool;
};
