// server/models/Horario.model.js
const db = require('../config/db.config');

/**
 * Obtiene el horario maestro (apertura, cierre, duración) de un club 
 * basado en el club_id y el día de la semana.
 * @param {number} clubId - ID del club.
 * @param {string} diaSemana - Día de la semana (LUN, MAR, etc.).
 * @returns {Promise<object|null>} El objeto de horario maestro.
 */
async function getHorarioMaestroByClubAndDay(clubId, diaSemana) {
    const sql = `
        SELECT hora_apertura, hora_cierre, duracion_turno 
        FROM horarios_club
        WHERE club_id = ? AND dia_semana = ?;
    `;
    
    try {
        const [results] = await db.query(sql, [clubId, diaSemana]);
        return results.length > 0 ? results[0] : null;
    } catch (error) {
        console.error("Error al obtener horario maestro:", error);
        throw new Error('Database query failed for master schedule');
    }
}


/**
 * Obtiene los horarios reservados o pendientes para una cancha y fecha dadas.
 * @param {number} canchaId - ID de la cancha a consultar.
 * @param {string} fecha - Fecha en formato 'YYYY-MM-DD'.
 * @returns {Promise<Array>} Array de objetos con { hora_inicio, estado }.
 */
async function getHorariosOcupados(canchaId, fecha) {
    // Buscamos todas las reservas que NO estén canceladas para esa cancha y fecha.
    const sql = `
        SELECT hora_inicio, estado
        FROM reservas
        WHERE cancha_id = ? 
        AND fecha = ? 
        AND estado IN ('PENDIENTE', 'CONFIRMADA');
    `;
    
    try {
        const [results] = await db.query(sql, [canchaId, fecha]);
        return results;
    } catch (error) {
        console.error("Error al obtener horarios ocupados:", error);
        throw new Error('Database query failed for reserved slots');
    }
}

/**
 * Crea una nueva reserva en la Base de Datos con estado 'PENDIENTE'.
 * @param {number} canchaId - ID de la cancha.
 * @param {number} usuarioId - ID del usuario (simulado desde el futuro JWT).
 * @param {string} fecha - Fecha de la reserva ('YYYY-MM-DD').
 * @param {string} horaInicio - Hora de inicio del turno ('HH:MM:SS').
 * @param {string} horaFin - Hora de fin del turno ('HH:MM:SS').
 * @returns {Promise<number>} El ID de la reserva insertada.
 */
async function createReserva(canchaId, usuarioId, fecha, horaInicio, horaFin) {
    // Insertamos el valor literal 'PENDIENTE' y calculamos la expiración (+20 MINUTE).
    const sql = `
        INSERT INTO reservas (cancha_id, usuario_id, fecha, hora_inicio, hora_fin, estado, expira_en)
        VALUES (?, ?, ?, ?, ?, 'PENDIENTE', DATE_ADD(NOW(), INTERVAL 20 MINUTE));
    `;
    const values = [canchaId, usuarioId, fecha, horaInicio, horaFin];

    try {
        const [result] = await db.query(sql, values);
        return result.insertId;
    } catch (error) {
        // Manejo de conflicto de clave única (si el slot ya estaba reservado)
        if (error.code === 'ER_DUP_ENTRY') {
            throw new Error('Slot already occupied or pending.');
        }
        console.error("Error al crear la reserva:", error);
        throw new Error('Database insertion failed.');
    }
}

/**
 * Elimina las reservas que están en estado 'PENDIENTE' y cuya hora de expiración ya ha pasado.
 * @returns {Promise<number>} Número de filas eliminadas.
 */
async function deleteReservasExpiradas() {
    const sql = `
        DELETE FROM reservas
        WHERE estado = 'PENDIENTE' 
        AND expira_en < NOW();
    `;

    try {
        const [result] = await db.query(sql);
        // result.affectedRows contiene el número de filas eliminadas
        return result.affectedRows;
    } catch (error) {
        console.error("Error al limpiar reservas expiradas:", error);
        throw new Error('Database cleanup failed');
    }
}

module.exports = {
    getHorarioMaestroByClubAndDay,
    getHorariosOcupados,
    createReserva,
    deleteReservasExpiradas
};