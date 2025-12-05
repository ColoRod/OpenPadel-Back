// server/services/CronService.js

import cron from 'node-cron';
import * as HorarioModel from '../models/Horario.model.js'; 

// Tarea a ejecutar cada minuto
const CLEANUP_CRON_EXPRESSION = '* * * * *'; // Ejecuta cada minuto

/**
 * Función principal que inicia el servicio de tareas programadas.
 */
function startCleanupJob() {
    console.log('CronJob: Inicializando servicio de limpieza de reservas expiradas.');

    // Programar la tarea para que se ejecute cada minuto
    cron.schedule(CLEANUP_CRON_EXPRESSION, async () => {
        try {
            // Llamar a la función del modelo para eliminar las reservas
            const deletedCount = await HorarioModel.deleteReservasExpiradas();
            
            if (deletedCount > 0) {
                console.log(`CronJob: Limpieza exitosa. Se eliminaron ${deletedCount} reservas expiradas.`);
            }
        } catch (error) {
            console.error('CronJob: Error crítico durante la limpieza de reservas:', error.message);
        }
    });

    console.log('CronJob: Tarea de limpieza programada para ejecutarse cada minuto.');
}

export default { startCleanupJob };
