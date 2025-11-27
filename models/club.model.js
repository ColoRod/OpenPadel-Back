const db = require('../config/db.config');

const getAllClubs = async () => {
  const [clubs] = await db.query(`
    SELECT 
      c.club_id,
      c.nombre,
      c.direccion,
      c.telefono,
      c.imagen_url,
      GROUP_CONCAT(car.nombre SEPARATOR ',') AS caracteristicas
    FROM clubes c
    LEFT JOIN club_caracteristica cc ON c.club_id = cc.club_id
    LEFT JOIN caracteristicas car ON cc.caract_id = car.caract_id
    GROUP BY c.club_id
  `);

  return clubs.map((club) => ({
    ...club,
    caracteristicas: club.caracteristicas ? club.caracteristicas.split(",") : [],
  }));
};

const getClubById = async (clubId) => {
  const [rows] = await db.query(`
    SELECT club_id, nombre, direccion, telefono, imagen_url
    FROM clubes WHERE club_id = ? LIMIT 1
  `, [clubId]);

  if (!rows || rows.length === 0) return null;

  const club = rows[0];

  // Get caracteristicas
  const [chars] = await db.query(`
    SELECT car.nombre
    FROM caracteristicas car
    JOIN club_caracteristica cc ON cc.caract_id = car.caract_id
    WHERE cc.club_id = ?
  `, [clubId]);

  return {
    ...club,
    caracteristicas: chars.map(c => c.nombre),
  };
};

module.exports = {
  getAllClubs,
  getClubById
};
