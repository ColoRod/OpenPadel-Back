import { getReservasByUser, deleteReservaById } from '../models/reserva.model.js';

export async function getReservasUsuario(req, res) {
  const { id } = req.params;

  try {
    const rows = await getReservasByUser(id);
    res.json(rows);
  } catch (err) {
    console.error('Error en getReservasUsuario:', err);
    res.status(500).json({ error: 'Error obteniendo reservas' });
  }
}

export async function cancelarReserva(req, res) {
  const { reservaId } = req.params;
  try {
    const affected = await deleteReservaById(reservaId);
    if (affected === 0) return res.status(404).json({ error: 'Reserva no encontrada' });
    res.json({ message: 'Reserva cancelada exitosamente' });
  } catch (err) {
    console.error('Error en cancelarReserva:', err);
    res.status(500).json({ error: 'Error cancelando reserva' });
  }
};
