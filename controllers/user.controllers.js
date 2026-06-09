import pool from "../config/db.config.js";
import bcrypt from "bcrypt";
import fs from "fs";

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT user_id AS id, club_id, nombre, apellido, email, telefono, dni, categoria, foto_url, rol 
       FROM usuarios 
       WHERE user_id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const userData = rows[0];

    if (userData.rol === 'admin' && userData.club_id) {
      const [clubRows] = await pool.query(
        `SELECT club_id, nombre, imagen_url 
         FROM clubes 
         WHERE club_id = ?`,
        [userData.club_id]
      );
      
      if (clubRows.length > 0) {
        userData.club = clubRows[0];
      } else {
        userData.club = null;
      }
    } else {
      userData.club = null;
    }

    res.json(userData);
  } catch (err) {
    console.error("PROFILE ERROR:", err);
    res.status(500).json({ error: "Error interno" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nombre, apellido, email, password, telefono, categoria, removeFoto } = req.body;

    if (telefono) {
      if (!/^\d+$/.test(telefono)) {
        return res.status(400).json({
          message: "El teléfono solo puede contener números"
        });
      }

      if (telefono.length < 10 || telefono.length > 11) {
        return res.status(400).json({
          message: "El teléfono debe tener entre 10 y 11 dígitos"
        });
      }
    }

    const [currentRows] = await pool.query(
      "SELECT foto_url FROM usuarios WHERE user_id = ?",
      [userId]
    );
    const oldFoto = currentRows[0]?.foto_url;

    let finalFotoUrl = oldFoto; 

    if (req.file) {
      finalFotoUrl = req.file.filename;
      if (oldFoto) {
        fs.unlink(`uploads/${oldFoto}`, (err) => {
          if (err) console.error(err);
        });
      }
    } 
    else if (removeFoto === true || removeFoto === "true") {
      finalFotoUrl = null; 
      if (oldFoto) {
        fs.unlink(`uploads/${oldFoto}`, (err) => {
          if (err) console.error(err);
        });
      }
    }

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
         foto_url = ? 
       WHERE user_id = ?`,
      [
        nombre || null,
        apellido || null,
        email || null,
        telefono || null,
        categoria || null,
        hashedPassword,
        finalFotoUrl, 
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
        message: "La nueva contraseña no puede ser igual a la actual"
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