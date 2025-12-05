// server/controllers/Horario.controller.js
import * as HorarioModel from '../models/Horario.model.js';
import db from '../config/db.config.js';
import * as CanchaModel from '../models/Cancha.model.js'; // Para obtener el club_id

/**
 * Función auxiliar para convertir un Date a un string de tiempo 'HH:MM:00'.
 * @param {Date} date - Objeto Date.
 * @returns {string} Tiempo formateado.
 */
function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}:00`;
}

/**
 * Función auxiliar para generar todos los slots de tiempo posibles.
 * @param {string} openTime - Hora de apertura ('HH:MM:SS').
 * @param {string} closeTime - Hora de cierre ('HH:MM:SS').
 * @param {number} durationMinutes - Duración del turno en minutos.
 * @returns {Array<string>} Lista de slots de tiempo 'HH:MM - HH:MM'.
 */
function generateTimeSlots(openTime, closeTime, durationMinutes) {
    const slots = [];
    const today = new Date();
    
    // Convertir strings de tiempo a objetos Date (solo para cálculo de tiempo)
    const [openHours, openMinutes] = openTime.split(':').map(Number);
    const [closeHours, closeMinutes] = closeTime.split(':').map(Number);

    let currentTime = new Date(today);
    currentTime.setHours(openHours, openMinutes, 0, 0);

    let closingTime = new Date(today);
    closingTime.setHours(closeHours, closeMinutes, 0, 0);

    // Iterar hasta que el slot termine antes o exactamente a la hora de cierre
    while (currentTime.getTime() < closingTime.getTime()) {
        const startTime = formatTime(currentTime);
        
        // Calcular la hora de fin del turno
        const endTimeDate = new Date(currentTime.getTime() + durationMinutes * 60000);
        
        // Si el final del slot excede la hora de cierre, no se incluye
        if (endTimeDate.getTime() > closingTime.getTime()) {
            break;
        }

        const endTime = formatTime(endTimeDate);
        slots.push(`${startTime.substring(0, 5)} - ${endTime.substring(0, 5)}`);

        // Avanzar el tiempo al inicio del siguiente slot
        currentTime = endTimeDate; 
    }

    return slots;
}

/**
 * @route GET /api/v1/horarios/:canchaId?fecha=YYYY-MM-DD
 * @description Obtiene los horarios disponibles, reservados y pendientes para una cancha y fecha.
 * @access Public
 */
async function getHorariosDisponibles(req, res) {
    const { canchaId } = req.params;
    const { fecha } = req.query;

    if (!canchaId || !fecha) {
        return res.status(400).json({
            message: "Faltan parámetros: canchaId y fecha son requeridos."
        });
    }

    try {
        // Paso 1: Obtener el ID del club asociado a la cancha y el día de la semana
        const dateObj = new Date(fecha);
        // Usamos .getUTCDay() para evitar problemas de zona horaria si la fecha viene de la DB
        const dayIndex = dateObj.getUTCDay(); // 0 (Dom) a 6 (Sáb)
        const DIAS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
        const diaSemana = DIAS[dayIndex];
        
        // Asumimos que la tabla Canchas tiene una columna club_id (¡crucial!)
        const [canchaResult] = await db.query('SELECT club_id FROM canchas WHERE cancha_id = ?', [canchaId]);
        if (!canchaResult || canchaResult.length === 0) {
             return res.status(404).json({ message: "Cancha no encontrada." });
        }
        const clubId = canchaResult[0].club_id;
        
        // Paso 2: Obtener el horario maestro (apertura/cierre/duración)
        const masterSchedule = await HorarioModel.getHorarioMaestroByClubAndDay(clubId, diaSemana);
        
        if (!masterSchedule) {
            // Si el club no abre ese día (ej. Domingo y no hay registro)
            return res.status(200).json({ 
                message: `El club no tiene horario definido para ${diaSemana}.`,
                data: [] 
            });
        }
        
        const { hora_apertura, hora_cierre, duracion_turno } = masterSchedule;

        // Paso 3: Generar todos los slots posibles del día
        const allSlots = generateTimeSlots(hora_apertura, hora_cierre, duracion_turno);
        
        // Paso 4: Obtener los slots que ya tienen una reserva o están pendientes
        const occupiedSlots = await HorarioModel.getHorariosOcupados(canchaId, fecha);
        
        // Crear un mapa para buscar rápidamente los slots ocupados
        // La clave es la hora de inicio (ej. '08:30:00')
        const occupiedMap = occupiedSlots.reduce((map, slot) => {
            // Utilizamos substring(0, 5) para manejar 'HH:MM:SS' vs 'HH:MM'
            map[slot.hora_inicio.substring(0, 5)] = slot.estado; 
            return map;
        }, {});

        // Paso 5: Combinar los slots generados con el estado de la DB
        const finalTimeSlots = allSlots.map(slot => {
            // Extraer la hora de inicio del slot (ej: '08:30')
            const startTime = slot.split(' - ')[0]; 
            const status = occupiedMap[startTime];

            let finalStatus;
            switch (status) {
                case 'CONFIRMADA':
                    finalStatus = 'reserved';
                    break;
                case 'PENDIENTE':
                    finalStatus = 'pending';
                    break;
                default:
                    finalStatus = 'available'; // Si no está en el mapa, está disponible
                    break;
            }
            
            return {
                time: slot, // El formato 'HH:MM - HH:MM'
                status: finalStatus
            };
        });

        res.status(200).json({
            message: "Horarios obtenidos exitosamente.",
            data: finalTimeSlots
        });

    } catch (error) {
        console.error("Error en el controlador al obtener horarios:", error.message);
        res.status(500).json({
            message: "Error interno del servidor al procesar la solicitud."
        });
    }
}

/**
 * @route POST /api/v1/horarios
 * @description Crea una nueva reserva para un slot específico.
 * @access Protegido (utiliza el userId del cliente)
 */
async function createReserva(req, res) {
    const { canchaId, userId, fecha, horaInicio, horaFin } = req.body;

    if (!canchaId || !userId || !fecha || !horaInicio || !horaFin) {
        return res.status(400).json({
            message: "Faltan parámetros: canchaId, userId, fecha, horaInicio y horaFin son requeridos."
        });
    }

    try {
        // Ejecutamos la inserción en el modelo usando el userId proporcionado
        const reservaId = await HorarioModel.createReserva(
            canchaId,
            userId,
            fecha,
            horaInicio,
            horaFin
        );

        res.status(201).json({
            message: "Reserva creada exitosamente con estado PENDIENTE.",
            reservaId: reservaId
        });

    } catch (error) {
        console.error("Error al crear reserva:", error.message);
        
        // Manejo de conflicto (si el slot ya estaba ocupado)
        if (error.message.includes('Slot already occupied')) {
            return res.status(409).json({
                message: "El horario seleccionado ya fue reservado o está pendiente de confirmación."
            });
        }

        res.status(500).json({
            message: "Error interno del servidor al crear la reserva."
        });
    }
}

export { getHorariosDisponibles, createReserva };