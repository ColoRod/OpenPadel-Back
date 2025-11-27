const db = require('../config/db.config');

const getUsuarioById = async (userId) => {
  const [rows] = await db.query(`
    SELECT user_id, nombre, apellido, email, telefono, foto_url
    FROM usuarios
    WHERE user_id = ?
    LIMIT 1
  `, [userId]);

  return rows[0] || null;
};

// Mock current user for now — in future this will be read from auth/session
const getCurrentUsuario = async () => {
  const USER_ID = 2;
  return getUsuarioById(USER_ID);
};

module.exports = {
  getUsuarioById,
  getCurrentUsuario
};
