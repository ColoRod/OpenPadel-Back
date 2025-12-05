import express from 'express';
import { obtenerReservas, confirmarReserva, eliminarReserva } from '../controllers/Reserva.controller.js';
import { verifyToken } from '../middlewares/auth.middlewares.js';

const router = express.Router();

// Rutas administrativas protegidas (requieren token)
router.get('/', verifyToken, obtenerReservas);          // GET /api/reservas (protegido)
router.put('/:id/confirmar', verifyToken, confirmarReserva); // PUT /api/reservas/1/confirmar (protegido)
router.delete('/:id', verifyToken, eliminarReserva);    // DELETE /api/reservas/1 (protegido)

export default router;