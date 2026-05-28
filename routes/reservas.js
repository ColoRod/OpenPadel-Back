import express from 'express';
import { getReservasUsuario, cancelarReserva, subirComprobante } from '../controllers/reservasController.js';
import { upload } from '../middlewares/upload.js'; // ya lo tenés

const router = express.Router();

// Obtener reservas del usuario (params: :id)
router.get('/:id', getReservasUsuario);

// Cancelar (eliminar) una reserva
router.delete('/:reservaId', cancelarReserva);

router.patch('/:reservaId/comprobante', upload.single('comprobante'), subirComprobante);

export default router;

