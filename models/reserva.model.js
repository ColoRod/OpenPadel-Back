const db = require('../config/db.config');

const getReservasByUser = async (userId) => {
  const [rows] = await db.query(
    `SELECT r.reserva_id, r.fecha, r.hora_inicio, r.hora_fin, r.estado, c.nombre AS club
     FROM reservas r
     JOIN canchas ch ON ch.cancha_id = r.cancha_id
     JOIN clubes c ON c.club_id = ch.club_id
     WHERE r.usuario_id = ?
     ORDER BY r.fecha ASC`,
    [userId]
  );

  return rows;
};

const deleteReservaById = async (reservaId) => {
  const [result] = await db.query(`DELETE FROM reservas WHERE reserva_id = ?`, [reservaId]);
  return result.affectedRows;
};

const createReserva = async (reserva) => {
  // reserva: {cancha_id, user_id, fecha, hora_inicio, hora_fin, estado}
  const [result] = await db.query(
    `INSERT INTO reservas (cancha_id, usuario_id, fecha, hora_inicio, hora_fin, estado, expira_en, solicitada_en)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [reserva.cancha_id, reserva.usuario_id, reserva.fecha, reserva.hora_inicio, reserva.hora_fin, reserva.estado || 'pendiente', reserva.expira_en || null, reserva.solicitada_en || null]
  );

  return result.insertId;
};

module.exports = {
  getReservasByUser,
  deleteReservaById,
  createReserva
};
