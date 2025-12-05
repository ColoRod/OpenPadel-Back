import express from 'express';
import { getReservasUsuario, cancelarReserva } from '../controllers/reservasController.js';

const router = express.Router();

// Obtener reservas del usuario (params: :id)
router.get('/:id', getReservasUsuario);

// Cancelar (eliminar) una reserva
router.delete('/:reservaId', cancelarReserva);

export default router;
