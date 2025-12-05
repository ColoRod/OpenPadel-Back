// server/routes/cancha.routes.js
import express from 'express';
const router = express.Router();
import * as CanchaController from '../controllers/Cancha.controller.js';

// Rutas más específicas PRIMERO
// Obtener canchas de un club específico por nombre
router.get('/club/:clubName', CanchaController.getCanchasByClubName);

// Rutas más genéricas DESPUÉS
// Definición de la ruta: GET /api/v1/canchas
router.get('/', CanchaController.getCanchasConDetalles);

export default router;