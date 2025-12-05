import db from '../config/db.config.js';

const getAll = () => {
    const sql = `
        SELECT 
            r.reserva_id AS id,
            r.fecha, 
            r.hora_inicio AS hora, 
            r.estado,
            r.cancha_id,
            c.nombre AS nombreCancha, 
            u.nombre AS nombreUsuario,
            u.apellido AS apellidoUsuario
        FROM reservas r
        JOIN usuarios u ON r.usuario_id = u.user_id
        JOIN canchas c ON r.cancha_id = c.cancha_id
        ORDER BY r.fecha ASC, r.hora_inicio ASC
    `;
    return db.execute(sql);
};

const getAllByAdmin = (adminId) => {
    const sql = `
        SELECT 
            r.reserva_id AS id,
            r.fecha, 
            r.hora_inicio AS hora, 
            r.estado,
            r.cancha_id,
            c.nombre AS nombreCancha, 
            u.nombre AS nombreUsuario,
            u.apellido AS apellidoUsuario
        FROM reservas r
        JOIN usuarios u ON r.usuario_id = u.user_id
        JOIN canchas c ON r.cancha_id = c.cancha_id
        JOIN clubes cl ON c.club_id = cl.club_id
        WHERE cl.admin_id = ?
        ORDER BY r.fecha ASC, r.hora_inicio ASC
    `;
    return db.execute(sql, [adminId]);
};

const confirm = (id) => {
    const sql = "UPDATE reservas SET estado = 'CONFIRMADA' WHERE reserva_id = ?";
    return db.execute(sql, [id]);
};

const remove = (id) => {
    const sql = "DELETE FROM reservas WHERE reserva_id = ?";
    return db.execute(sql, [id]);
};

export default {
    getAll,
    getAllByAdmin,
    confirm,
    delete: remove
};