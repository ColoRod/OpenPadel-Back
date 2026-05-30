import db from '../config/db.config.js';
import { getReservasByUser, deleteReservaById, getHistorialByUser } from '../models/reserva.model.js';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import '../config/cloudinary.config.js';

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
    const [result] = await db.query(
      `UPDATE reservas SET estado = 'CANCELADA' WHERE reserva_id = ?`,
      [reservaId]
    );
    if (result.affectedRows === 0) 
      return res.status(404).json({ error: 'Reserva no encontrada' });
    res.json({ message: 'Reserva cancelada exitosamente' });
  } catch (err) {
    console.error('Error en cancelarReserva:', err);
    res.status(500).json({ error: 'Error cancelando reserva' });
  }
}

export async function subirComprobante(req, res) {
  const { reservaId } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: 'No se recibió ningún archivo' });
  }

  try {
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'comprobantes',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    await db.query(
      'UPDATE reservas SET comprobante_url = ? WHERE reserva_id = ?',
      [uploadResult.secure_url, reservaId]
    );

    res.json({ comprobante_url: uploadResult.secure_url });
  } catch (err) {
    console.error('Error subiendo comprobante:', err);
    res.status(500).json({ error: 'Error al subir el comprobante' });
  }
}

// Obtiene diferencias entre reservas reales y reservas_notificaciones
export async function getNotificaciones(req, res) {
  const { userId } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT r.reserva_id, r.estado AS estado_actual,
              rn.estado AS estado_notif,
              c.nombre AS cancha_nombre,
              cl.nombre AS club,
              r.hora_inicio, r.hora_fin
       FROM reservas r
       JOIN reservas_notificaciones rn ON r.reserva_id = rn.reserva_id
       JOIN canchas c ON r.cancha_id = c.cancha_id
       JOIN clubes cl ON c.club_id = cl.club_id
       WHERE r.usuario_id = ? AND r.estado != rn.estado`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error en getNotificaciones:', err);
    res.status(500).json({ error: 'Error obteniendo notificaciones' });
  }
}

// Inicializa reservas_notificaciones para reservas que todavía no tienen fila
export async function inicializarNotificaciones(req, res) {
  const { userId } = req.params;
  try {
    await db.query(
      `INSERT INTO reservas_notificaciones (reserva_id, user_id, estado)
       SELECT r.reserva_id, r.usuario_id, r.estado
       FROM reservas r
       LEFT JOIN reservas_notificaciones rn ON r.reserva_id = rn.reserva_id
       WHERE r.usuario_id = ? AND rn.id IS NULL`,
      [userId]
    );
    res.json({ message: 'Inicializado correctamente' });
  } catch (err) {
    console.error('Error en inicializarNotificaciones:', err);
    res.status(500).json({ error: 'Error inicializando notificaciones' });
  }
}

// Sincroniza reservas_notificaciones con el estado actual (al abrir la campana)
export async function sincronizarNotificaciones(req, res) {
  const { userId } = req.params;
  try {
    await db.query(
      `UPDATE reservas_notificaciones rn
       JOIN reservas r ON rn.reserva_id = r.reserva_id
       SET rn.estado = r.estado
       WHERE rn.user_id = ?`,
      [userId]
    );
    res.json({ message: 'Sincronizado correctamente' });
  } catch (err) {
    console.error('Error en sincronizarNotificaciones:', err);
    res.status(500).json({ error: 'Error sincronizando notificaciones' });
  }
}

export async function getHistorialUsuario(req, res) {
  const { id } = req.params;
  const { club, estado, desde, hasta } = req.query;
  try {
    const rows = await getHistorialByUser(id, { club, estado, desde, hasta });
    res.json(rows);
  } catch (err) {
    console.error('Error en getHistorialUsuario:', err);
    res.status(500).json({ error: 'Error obteniendo historial' });
  }
}