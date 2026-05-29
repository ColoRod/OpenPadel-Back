import Reserva from '../models/Reserva.model copy.js';

// OBTENER LISTA (GET) - Solo reservas del club del admin autenticado
export const obtenerReservas = async (req, res) => {
    try {
        // Extraer el userId del token verificado por el middleware
        const adminId = req.user?.id || req.user?.user_id;

        console.log("🔍 DEBUG obtenerReservas - req.user:", req.user);
        console.log("🔍 DEBUG obtenerReservas - adminId extraído:", adminId);

        if (!adminId) {
            return res.status(401).json({ message: "Admin no autenticado" });
        }

        // Obtener todas las reservas pero filtradas por admin_id del club
        const [rows] = await Reserva.getAllByAdmin(adminId);
        console.log("🔍 DEBUG obtenerReservas - reservas encontradas:", rows.length);

        const reservasFormateadas = rows.map(row => ({
            id: row.id,
            courtId: `c${row.cancha_id}`,
            courtName: row.nombreCancha,
            date: new Date(row.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
            time: row.hora.substring(0, 5),
            status: row.estado === 'CONFIRMADA' ? 'confirmed' : 'pending',
            userName: `${row.nombreUsuario} ${row.apellidoUsuario}`
        }));

        res.json(reservasFormateadas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener reservas" });
    }
};

// CONFIRMAR (PUT)
export const confirmarReserva = async (req, res) => {
    try {
        const { id } = req.params;
        await Reserva.confirm(id);
        res.json({ message: "Reserva confirmada exitosamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al confirmar la reserva" });
    }
};

// ELIMINAR / RECHAZAR / CANCELAR (DELETE)
export const eliminarReserva = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`➡️ Intentando ELIMINAR reserva con ID: ${id}`);

        const result = await Reserva.delete(id);

        if (!result || result.affectedRows === 0) {
            console.log("⚠️ No se encontró nada para borrar.");
            return res.status(404).json({ message: "No se encontró la reserva" });
        }

        console.log("✅ Reserva eliminada correctamente.");
        res.json({ message: "Reserva eliminada exitosamente" });

    } catch (error) {
        console.error("❌ Error al eliminar:", error);
        res.status(500).json({ message: "Error al eliminar la reserva" });
    }
};