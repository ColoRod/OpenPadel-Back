// server/routes/Horario.routes.js
const express = require('express');
const router = express.Router();
const HorarioController = require('../controllers/Horario.controller');

/**
 * @route GET /api/v1/horarios/:canchaId
 * @queryParam fecha - Fecha en formato YYYY-MM-DD
 * @description Obtiene el listado de horarios disponibles para una cancha y fecha específica.
 */
router.get('/:canchaId', HorarioController.getHorariosDisponibles);

// 2. Ruta POST para crear una reserva
// POST /api/v1/horarios
router.post('/', HorarioController.createReserva);

module.exports = router;