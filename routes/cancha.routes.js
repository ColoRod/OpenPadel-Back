// server/routes/cancha.routes.js
const express = require('express');
const router = express.Router();
const CanchaController = require('../controllers/Cancha.controller');

// Definición de la ruta: GET /api/v1/canchas
router.get('/', CanchaController.getCanchasConDetalles);

module.exports = router;