// server/config/db.config.js
require('dotenv').config(); // Carga las variables del .env

const mysql = require('mysql2');
const { URL } = require('url');

// Construir la configuración del pool soportando dos casos:
// 1) Variables separadas: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
// 2) URL única proporcionada por Railway (ej: DATABASE_URL o MYSQL_URL)
function buildDbConfigFromEnv() {
    // Si hay una URL completa, parsearla (Railway suele exponerla)
    const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL || '';
    if (dbUrl) {
        try {
            const parsed = new URL(dbUrl);
            return {
                host: parsed.hostname,
                user: parsed.username,
                password: parsed.password,
                database: parsed.pathname ? parsed.pathname.replace(/^\//, '') : undefined,
                port: parsed.port ? Number(parsed.port) : undefined,
                waitForConnections: true,
                connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
                queueLimit: 0,
                // Si tu proveedor requiere SSL, puedes activar con DB_REQUIRE_SSL=true
                ...(process.env.DB_REQUIRE_SSL === 'true' ? { ssl: { rejectUnauthorized: true } } : {})
            };
        } catch (err) {
            console.error('DB: Error al parsear la URL de conexión desde env:', err.message);
            // Caerá al uso de variables separadas abajo
        }
    }

    // Variables separadas como fallback
    if (!process.env.DB_HOST || !process.env.DB_USER) {
        console.warn('DB: No se encontraron todas las variables DB_HOST/DB_USER en el entorno. Revisa tu .env o las Environment Variables en Railway.');
    }

    return {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
        waitForConnections: true,
        connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
        queueLimit: 0,
        ...(process.env.DB_REQUIRE_SSL === 'true' ? { ssl: { rejectUnauthorized: true } } : {})
    };
}

const poolConfig = buildDbConfigFromEnv();

const pool = mysql.createPool(poolConfig);
const poolPromise = pool.promise();

// Hacemos una comprobación de conexión no bloqueante para ayudar al diagnóstico.
poolPromise.query('SELECT 1').then(() => {
    console.log('DB: Conexión a la base de datos OK.');
}).catch((err) => {
    console.error('DB: Error al conectar con la base de datos. Revise las variables de entorno y la disponibilidad del servicio.');
    console.error('DB: detalle del error:', err && err.message ? err.message : err);
});

module.exports = poolPromise;