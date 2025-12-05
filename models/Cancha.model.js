// server/models/Cancha.model.js

// Importamos la conexión a la base de datos que definimos en db.config.js
import db from '../config/db.config.js';

/**
 * Obtiene la lista de todas las canchas disponibles, sus clubes asociados
 * y devuelve sus características como un ARRAY JSON.
 * Opcionalmente puede filtrar por nombre de club.
 *
 * @param {string} clubName - Nombre del club para filtrar (opcional)
 * @returns {Promise<Array>} Un array de objetos que representan las canchas con sus detalles.
 */
async function findAllCanchasConCaracteristicas(clubName = null) {
    // La compleja consulta SQL para unir Canchas, Clubes y Características
    let sql = `
        SELECT
            c.cancha_id,
            cl.club_id AS club_id,
            c.nombre AS cancha_nombre,
            CONCAT('/images/', c.imagen_url) AS imagen_url,
            CAST(c.precio_base AS FLOAT) AS precio_base,
            cl.nombre AS club_nombre,
            cl.direccion AS club_direccion,
            
            -- Crea un array JSON de objetos {nombre, icono_url} por cada cancha
            JSON_ARRAYAGG(
                JSON_OBJECT('text', t.nombre, 'imageUrl', CONCAT('/images/', t.icono_url))
            ) AS caracteristicas
            
        FROM
            canchas c
        JOIN
            clubes cl ON c.club_id = cl.club_id
        LEFT JOIN
            cancha_caracteristica cc ON c.cancha_id = cc.cancha_id
        LEFT JOIN
            caracteristicas t ON cc.caract_id = t.caract_id
    `;
    
    // Add WHERE clause if clubName filter is provided
    if (clubName) {
        sql += ` WHERE cl.nombre = ?`;
    }
    
    sql += `
        GROUP BY
            c.cancha_id, c.nombre, c.imagen_url, cl.nombre, cl.direccion
        HAVING
            c.cancha_id IS NOT NULL
        ORDER BY
            c.cancha_id ASC;
    `;

    try {
        // Ejecutamos la query usando el pool de conexiones
        const params = clubName ? [clubName] : [];
        const [results] = await db.query(sql, params);
        // results contiene un array de los registros devueltos por MySQL
        return results;
    } catch (error) {
        console.error("Error al buscar canchas y características:", error);
        // Lanzamos el error para que el controlador lo maneje
        throw new Error('Database query failed');
    }
}

// Exportamos la función para usarla en el controlador
export { findAllCanchasConCaracteristicas };