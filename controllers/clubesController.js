// Controlador de clubes
const { getAllClubs } = require('../models/club.model');

exports.getClubes = async function (req, res) {
  try {
    const clubes = await getAllClubs();
    res.json(clubes);
  } catch (err) {
    console.error('Error en getClubes:', err);
    res.status(500).json({ error: 'Error obteniendo clubes' });
  }
};
