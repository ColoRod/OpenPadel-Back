// server/models/Cancha.model.js

// Importamos la conexión a la base de datos que definimos en db.config.js
const db = require('../config/db.config');

/**
 * Obtiene la lista de todas las canchas disponibles, sus clubes asociados
 * y devuelve sus características como un ARRAY JSON.
 *
 * @returns {Promise<Array>} Un array de objetos que representan las canchas con sus detalles.
 */
async function findAllCanchasConCaracteristicas() {
    // La compleja consulta SQL para unir Canchas, Clubes y Características
    const sql = `
        SELECT
            C.cancha_id,
            C.nombre AS cancha_nombre,
            CONCAT('/images/', C.imagen_url) AS imagen_url,
            CAST(C.precio_base AS FLOAT) AS precio_base,
            CL.nombre AS club_nombre,
            CL.direccion AS club_direccion,
            
            -- Crea un array JSON de objetos {nombre, icono_url} por cada cancha
            JSON_ARRAYAGG(
                JSON_OBJECT('text', T.nombre, 'imageUrl', CONCAT('/images/', T.icono_url))
            ) AS caracteristicas
            
        FROM
            Canchas C
        JOIN
            Clubes CL ON C.club_id = CL.club_id
        LEFT JOIN
            Cancha_Caracteristica CC ON C.cancha_id = CC.cancha_id
        LEFT JOIN
            Caracteristicas T ON CC.caract_id = T.caract_id
        GROUP BY
            C.cancha_id, C.nombre, C.imagen_url, CL.nombre, CL.direccion
        HAVING
            C.cancha_id IS NOT NULL; -- Asegura que solo devolvemos canchas válidas
    `;

    try {
        // Ejecutamos la query usando el pool de conexiones
        const [results] = await db.query(sql);
        // results contiene un array de los registros devueltos por MySQL
        return results;
    } catch (error) {
        console.error("Error al buscar canchas y características:", error);
        // Lanzamos el error para que el controlador lo maneje
        throw new Error('Database query failed');
    }
}

// Exportamos la función para usarla en el controlador
module.exports = {
    findAllCanchasConCaracteristicas
};