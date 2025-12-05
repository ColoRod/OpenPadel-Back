// Controlador de clubes
import { getAllClubs } from '../models/club.model.js';

export async function getClubes(req, res) {
  try {
    const clubes = await getAllClubs();
    res.json(clubes);
  } catch (err) {
    console.error('Error en getClubes:', err);
    res.status(500).json({ error: 'Error obteniendo clubes' });
  }
}
