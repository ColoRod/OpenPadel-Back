import db from '../config/db.config.js';
import { getReservasByUser, deleteReservaById } from '../models/reserva.model.js';
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
    const affected = await deleteReservaById(reservaId);
    if (affected === 0) return res.status(404).json({ error: 'Reserva no encontrada' });
    res.json({ message: 'Reserva cancelada exitosamente' });
  } catch (err) {
    console.error('Error en cancelarReserva:', err);
    res.status(500).json({ error: 'Error cancelando reserva' });
  }
};

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
          resource_type: 'auto' // acepta imagen y PDF
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