// server/config/db.config.js
require('dotenv').config(); // Carga las variables del .env

const mysql = require('mysql2');

// Conexión usando las variables de entorno
const connection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Exporta el pool para poder ejecutar queries en los modelos
module.exports = connection.promise();