// server/models/Horario.model.js
import db from '../config/db.config.js';

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
    let conn;
    try {
        conn = await db.getConnection();
        await conn.beginTransaction();

        // Verificar si el slot está ocupado por una reserva activa
        const [active] = await conn.query(
            `SELECT reserva_id FROM reservas
             WHERE cancha_id = ? AND fecha = ? AND hora_inicio = ?
             AND estado IN ('PENDIENTE', 'CONFIRMADA')`,
            [canchaId, fecha, horaInicio]
        );

        if (active.length > 0) {
            await conn.rollback();
            throw new Error('Slot already occupied');
        }

        // Verificar si existe una reserva cancelada o rechazada en ese slot
        const [cancelled] = await conn.query(
            `SELECT reserva_id FROM reservas
             WHERE cancha_id = ? AND fecha = ? AND hora_inicio = ?
             AND estado IN ('CANCELADA', 'RECHAZADA')
             ORDER BY reserva_id DESC
             LIMIT 1`,
            [canchaId, fecha, horaInicio]
        );

        let reservaId;

        if (cancelled.length > 0) {
            // ✅ Reutilizar la fila existente: actualizar a PENDIENTE
            reservaId = cancelled[0].reserva_id;
            await conn.query(
                `UPDATE reservas 
                 SET usuario_id = ?, hora_fin = ?, estado = 'PENDIENTE',
                     expira_en = DATE_ADD(NOW(), INTERVAL 20 MINUTE),
                     solicitada_en = NOW()
                 WHERE reserva_id = ?`,
                [usuarioId, horaFin, reservaId]
            );

            // Actualizar notificación existente o insertar si no existe
            const [notif] = await conn.query(
                `SELECT id FROM reservas_notificaciones WHERE reserva_id = ?`,
                [reservaId]
            );
            if (notif.length > 0) {
                await conn.query(
                    `UPDATE reservas_notificaciones SET estado = 'PENDIENTE' WHERE reserva_id = ?`,
                    [reservaId]
                );
            } else {
                await conn.query(
                    `INSERT INTO reservas_notificaciones (reserva_id, user_id, estado) VALUES (?, ?, 'PENDIENTE')`,
                    [reservaId, usuarioId]
                );
            }
        } else {
            // ✅ No existe ninguna reserva previa: INSERT normal
            const [result] = await conn.query(
                `INSERT INTO reservas (cancha_id, usuario_id, fecha, hora_inicio, hora_fin, estado, expira_en, solicitada_en)
                 VALUES (?, ?, ?, ?, ?, 'PENDIENTE', DATE_ADD(NOW(), INTERVAL 20 MINUTE), NOW())`,
                [canchaId, usuarioId, fecha, horaInicio, horaFin]
            );
            reservaId = result.insertId;

            await conn.query(
                `INSERT INTO reservas_notificaciones (reserva_id, user_id, estado) VALUES (?, ?, 'PENDIENTE')`,
                [reservaId, usuarioId]
            );
        }

        await conn.commit();
        return reservaId;

    } catch (error) {
        if (conn) await conn.rollback();
        if (error.message === 'Slot already occupied' || error.code === 'ER_DUP_ENTRY') {
            throw new Error('Slot already occupied');
        }
        console.error("Error al crear la reserva:", error);
        throw new Error('Database insertion failed.');
    } finally {
        if (conn) conn.release();
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

async function finalizarReservasVencidas() {
    const sql = `
        UPDATE reservas 
        SET estado = 'FINALIZADA'
        WHERE estado = 'CONFIRMADA'
        AND TIMESTAMP(fecha, hora_fin) < NOW();
    `;
    try {
        const [result] = await db.query(sql);
        return result.affectedRows;
    } catch (error) {
        console.error("Error al finalizar reservas vencidas:", error);
        throw new Error('Database update failed');
    }
}

export { getHorarioMaestroByClubAndDay, getHorariosOcupados, createReserva, deleteReservasExpiradas, finalizarReservasVencidas };