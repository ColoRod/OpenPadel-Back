import express from 'express';
import { obtenerReservas, confirmarReserva, eliminarReserva, rechazarReserva } from '../controllers/Reserva.controller.js';
import { verifyToken } from '../middlewares/auth.middlewares.js';

const router = express.Router();

// Rutas administrativas protegidas (requieren token)
router.get('/', verifyToken, obtenerReservas);          // GET (protegido)
router.put('/:id/confirmar', verifyToken, confirmarReserva); // PUT - Confirmar (protegido)
router.put('/:id/rechazar', verifyToken, rechazarReserva);   // PUT - Rechazar/Borrado lógico (protegido) - ¡NUEVA LÍNEA!
router.delete('/:id', verifyToken, eliminarReserva);    // DELETE - Eliminación física (protegido)

export default router;