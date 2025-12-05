// server/routes/Horario.routes.js
import express from 'express';
const router = express.Router();
import * as HorarioController from '../controllers/Horario.controller.js';

/**
 * @route GET /api/v1/horarios/:canchaId
 * @queryParam fecha - Fecha en formato YYYY-MM-DD
 * @description Obtiene el listado de horarios disponibles para una cancha y fecha específica.
 */
router.get('/:canchaId', HorarioController.getHorariosDisponibles);

// 2. Ruta POST para crear una reserva
// POST /api/v1/horarios
router.post('/', HorarioController.createReserva);

export default router;