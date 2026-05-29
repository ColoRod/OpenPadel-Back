import db from '../config/db.config.js';

const getAllClubs = async () => {
  const [clubs] = await db.query(`
    SELECT 
      c.club_id,
      c.nombre,
      c.direccion,
      c.telefono,
      c.imagen_url,
      GROUP_CONCAT(DISTINCT car_club.nombre ORDER BY car_club.nombre SEPARATOR ',') AS caracteristicas_club,
      GROUP_CONCAT(DISTINCT car_cancha.nombre ORDER BY car_cancha.nombre SEPARATOR ',') AS caracteristicas_canchas
    FROM clubes c
    LEFT JOIN club_caracteristica cc ON c.club_id = cc.club_id
    LEFT JOIN caracteristicas car_club ON cc.caract_id = car_club.caract_id
    LEFT JOIN canchas ca ON ca.club_id = c.club_id
    LEFT JOIN cancha_caracteristica cca ON cca.cancha_id = ca.cancha_id
    LEFT JOIN caracteristicas car_cancha ON cca.caract_id = car_cancha.caract_id
    GROUP BY c.club_id
  `);

  return clubs.map((club) => ({
    ...club,
    caracteristicas: club.caracteristicas_club
      ? club.caracteristicas_club.split(',')
      : [],
    caracteristicas_canchas: club.caracteristicas_canchas
      ? [...new Set(club.caracteristicas_canchas.split(','))]
      : [],
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

export { getAllClubs, getClubById };
