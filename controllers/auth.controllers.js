import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import cloudinary from "../config/cloudinary.config.js";

import {
  getUserByEmail,
  createUser
} from "../models/User.model.js";

// ---------------------- SUBIR FOTO A CLOUDINARY ----------------------
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "openpadel/users"
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result.secure_url);
      }
    );

    uploadStream.end(file.buffer);
  });
};


// ---------------------- REGISTER ----------------------
export const register = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      email,
      password,
      dni,
      telefono,
      categoria
    } = req.body;

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
        return res.status(400).json({
          message: v.message
        });
      }
    }

    // Chequear email repetido
    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      return res.status(400).json({
        message: "El email ya está registrado."
      });
    }

    // Campos obligatorios
    if (
      !nombre ||
      !apellido ||
      !email ||
      !password ||
      !dni ||
      !telefono ||
      !categoria
    ) {
      return res.status(400).json({
        message: "Todos los campos son obligatorios."
      });
    }

    // ------------- SUBIDA A CLOUDINARY -------------
    const foto_url = await uploadToCloudinary(req.file);

    // ------------- REGISTRO FINAL -------------
    const hashedPassword = await bcrypt.hash(password, 10);

    const userId = await createUser({
      nombre,
      apellido,
      email,
      password: hashedPassword,
      dni,
      telefono,
      categoria,
      foto_url
    });

    const token = jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

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
        foto_url
      }
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      message: "Error en el registro."
    });
  }
};


// ---------------------- LOGIN ----------------------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(400).json({
        error: "Email o contraseña incorrectos"
      });
    }

    const ok = await bcrypt.compare(
      password,
      user.password
    );

    if (!ok) {
      return res.status(400).json({
        error: "Contraseña incorrecta"
      });
    }

    const token = jwt.sign(
      { id: user.user_id },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
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

    res.status(500).json({
      error: "Error interno"
    });
  }
};


// ---------------------- LOGOUT ----------------------
export const logout = (req, res) => {
  res.json({
    message: "Logout exitoso"
  });
};
