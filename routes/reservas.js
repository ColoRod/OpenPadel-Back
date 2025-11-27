const express = require('express');
const { getReservasUsuario, cancelarReserva } = require('../controllers/reservasController');

const router = express.Router();

// Obtener reservas del usuario (params: :id)
router.get('/:id', getReservasUsuario);

// Cancelar (eliminar) una reserva
router.delete('/:reservaId', cancelarReserva);

module.exports = router;
