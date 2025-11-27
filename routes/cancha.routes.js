// server/routes/cancha.routes.js
const express = require('express');
const router = express.Router();
const CanchaController = require('../controllers/Cancha.controller');

// Rutas más específicas PRIMERO
// Obtener canchas de un club específico por nombre
router.get('/club/:clubName', CanchaController.getCanchasByClubName);

// Rutas más genéricas DESPUÉS
// Definición de la ruta: GET /api/v1/canchas
router.get('/', CanchaController.getCanchasConDetalles);

module.exports = router;