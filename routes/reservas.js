import express from 'express';
import { getReservasUsuario, cancelarReserva, subirComprobante,getNotificaciones, inicializarNotificaciones, sincronizarNotificaciones } from '../controllers/reservasController.js';
import { upload } from '../middlewares/upload.js'; // ya lo tenés

const router = express.Router();

// Obtener reservas del usuario (params: :id)
router.get('/:id', getReservasUsuario);

// Cancelar (eliminar) una reserva
router.delete('/:reservaId', cancelarReserva);

router.patch('/:reservaId/comprobante', upload.single('comprobante'), subirComprobante);

// Agregar estas 3 rutas nuevas (las existentes no se tocan)
router.get('/:userId/notificaciones', getNotificaciones);
router.post('/:userId/notificaciones/inicializar', inicializarNotificaciones);
router.put('/:userId/notificaciones/sincronizar', sincronizarNotificaciones);
export default router;

