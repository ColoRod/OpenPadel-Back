import pool from "../config/db.config.js";
import bcrypt from "bcrypt";

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log("BODY:", req.body);
console.log("USER:", req.user);

    const [rows] = await pool.query(
      `SELECT user_id AS id, nombre, apellido, email, telefono, dni, categoria, foto_url 
FROM usuarios 
WHERE user_id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("PROFILE ERROR:", err);
    res.status(500).json({ error: "Error interno" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { nombre, apellido, email, password, telefono, categoria } = req.body;

    if (telefono) {

  if (!/^\d+$/.test(telefono)) {
    return res.status(400).json({
      message:
        "El teléfono solo puede contener números"
    });
  }

  if (
    telefono.length < 10 ||
    telefono.length > 11
  ) {
    return res.status(400).json({
      message:
        "El teléfono debe tener entre 10 y 11 dígitos"
    });
  }
}

    const foto_url = req.file ? req.file.filename : null;

    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    await pool.query(
      `UPDATE usuarios 
       SET 
         nombre = IFNULL(?, nombre),
         apellido = IFNULL(?, apellido),
         email = IFNULL(?, email),
         telefono = IFNULL(?, telefono),
         categoria = IFNULL(?, categoria),
         password = IFNULL(?, password),
         foto_url = IFNULL(?, foto_url)
       WHERE user_id = ?`,
      [
        nombre || null,
        apellido || null,
        email || null,
        telefono || null,
        categoria || null,
        hashedPassword,
        foto_url,
        userId
      ]
    );

    res.json({ message: "Perfil actualizado correctamente" });
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    res.status(500).json({ error: "Error interno" });
  }
  
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;

    const { currentPassword, newPassword } = req.body;

    const [rows] = await pool.query(
      "SELECT password FROM usuarios WHERE user_id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Usuario no encontrado"
      });
    }

    const user = rows[0];

    const valid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!valid) {
      return res.status(400).json({
        message: "La contraseña actual es incorrecta"
      });
    }

    const samePassword = await bcrypt.compare(
    newPassword,
    user.password
    );

    if (samePassword) {
        return res.status(400).json({
        message:
        "La nueva contraseña no puede ser igual a la actual"
      });
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    await pool.query(
      "UPDATE usuarios SET password = ? WHERE user_id = ?",
      [hashedPassword, userId]
    );

    res.json({
      message: "Contraseña actualizada"
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Error interno"
    });
  }
};