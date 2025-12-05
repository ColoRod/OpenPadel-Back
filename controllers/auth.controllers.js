import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import pool from "../config/db.config.js";

// Función auxiliar para borrar la foto subida
const deleteUploadedFile = (file) => {
  if (!file) return;
  fs.unlink(`uploads/${file.filename}`, (err) => {
    if (err) console.log("Error al borrar archivo:", err);
  });
};

// ---------------------- REGISTER ----------------------
export const register = async (req, res) => {
  try {
    const { nombre, apellido, email, password, dni, telefono, categoria } = req.body;

    // ------------- VALIDACIONES -------------
    const validations = [
      {
        test: /^[a-zA-ZÀ-ÿ\s]*$/.test(nombre),
        message: "El nombre solo puede contener letras."
      },
      {
        test: /^[a-zA-ZÀ-ÿ\s]*$/.test(apellido),
        message: "El apellido solo puede contener letras."
      },
      {
        test: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        message: "El email no es válido."
      },
      {
        test: /^\d{7,15}$/.test(telefono),
        message: "Número de teléfono inválido."
      },
      {
        test: /^\d{3,10}$/.test(dni),
        message: "DNI inválido."
      }
    ];

    for (const v of validations) {
      if (!v.test) {
        deleteUploadedFile(req.file);  // <-- borrar la foto
        return res.status(400).json({ message: v.message });
      }
    }

    // Chequear email repetido
    const [exists] = await pool.query(
      "SELECT * FROM usuarios WHERE email = ?",
      [email]
    );

    if (exists.length > 0) {
      deleteUploadedFile(req.file);
      return res.status(400).json({ message: "El email ya está registrado." });
    }

    if (!nombre || !apellido || !email || !password || !dni || !telefono || !categoria) {
      deleteUploadedFile(req.file);
      return res.status(400).json({ message: "Todos los campos son obligatorios." });
    }

    // ------------- REGISTRO FINAL -------------
    const hashedPassword = await bcrypt.hash(password, 10);
    const foto_url = req.file ? req.file.filename : null;

    const [result] = await pool.query(
      `INSERT INTO usuarios 
        (rol, nombre, apellido, email, password, dni, telefono, categoria, foto_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "jugador",
        nombre,
        apellido,
        email,
        hashedPassword,
        dni,
        telefono,
        categoria,
        foto_url
      ]
    );

    const userId = result.insertId;

    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(201).json({
      message: "Usuario registrado exitosamente",
      token,
      user: {
        id: userId,
        nombre,
        apellido,
        email,
        dni,
        telefono,
        categoria,
        foto_url,
      },
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    // Borrar archivo también si cae al catch
    deleteUploadedFile(req.file);

    return res.status(500).json({ message: "Error en el registro." });
  }
};


// ---------------------- LOGIN ----------------------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query(
      "SELECT * FROM usuarios WHERE email = ?",
      [email]
    );

    if (rows.length === 0)
      return res.status(400).json({ error: "Email o contraseña incorrectos" });

    const user = rows[0];

    const ok = await bcrypt.compare(password, user.password);

    if (!ok)
      return res.status(400).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign(
      { id: user.user_id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login correcto",
      token,
      user: {
        id: user.user_id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        telefono: user.telefono,
        dni: user.dni,
        rol: user.rol
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Error interno" });
  }
};

// ---------------------- LOGOUT ----------------------
export const logout = (req, res) => {
  res.json({ message: "Logout exitoso" });
};

