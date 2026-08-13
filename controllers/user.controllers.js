import bcrypt from "bcrypt";
import fs from "fs";

import {
  getUserProfileById,
  getUserPhotoById,
  updateUserProfile,
  getUserPasswordById,
  updateUserPassword
} from "../models/User.model.js";


// ---------------------- GET PROFILE ----------------------
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const userData = await getUserProfileById(userId);

    if (!userData) {
      return res.status(404).json({
        message: "Usuario no encontrado"
      });
    }

    res.json(userData);

  } catch (err) {
    console.error("PROFILE ERROR:", err);

    res.status(500).json({
      error: "Error interno"
    });
  }
};


// ---------------------- UPDATE PROFILE ----------------------
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      nombre,
      apellido,
      email,
      password,
      telefono,
      categoria,
      removeFoto
    } = req.body;


    // Validación teléfono
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


    // Obtener foto actual
    const oldFoto = await getUserPhotoById(userId);

    let finalFotoUrl = oldFoto;


    // Si subió una nueva foto
    if (req.file) {
      finalFotoUrl = req.file.filename;

      if (oldFoto) {
        fs.unlink(`uploads/${oldFoto}`, (err) => {
          if (err) {
            console.error(err);
          }
        });
      }
    }

    // Si pidió eliminar la foto
    else if (
      removeFoto === true ||
      removeFoto === "true"
    ) {
      finalFotoUrl = null;

      if (oldFoto) {
        fs.unlink(`uploads/${oldFoto}`, (err) => {
          if (err) {
            console.error(err);
          }
        });
      }
    }


    // Hashear contraseña solamente si mandó una nueva
    let hashedPassword = null;

    if (password) {
      hashedPassword = await bcrypt.hash(
        password,
        10
      );
    }


    // Actualizar usuario
    await updateUserProfile(
      userId,
      {
        nombre,
        apellido,
        email,
        telefono,
        categoria,
        hashedPassword,
        finalFotoUrl
      }
    );


    res.json({
      message: "Perfil actualizado correctamente"
    });

  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);

    res.status(500).json({
      error: "Error interno"
    });
  }
};


// ---------------------- CHANGE PASSWORD ----------------------
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      currentPassword,
      newPassword
    } = req.body;


    // Obtener contraseña actual
    const currentHash = await getUserPasswordById(userId);

    if (!currentHash) {
      return res.status(404).json({
        message: "Usuario no encontrado"
      });
    }


    // Comprobar contraseña actual
    const valid = await bcrypt.compare(
      currentPassword,
      currentHash
    );

    if (!valid) {
      return res.status(400).json({
        message: "La contraseña actual es incorrecta"
      });
    }


    // Comprobar que la nueva sea diferente
    const samePassword = await bcrypt.compare(
      newPassword,
      currentHash
    );

    if (samePassword) {
      return res.status(400).json({
        message: "La nueva contraseña no puede ser igual a la actual"
      });
    }


    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );


    // Guardarla
    await updateUserPassword(
      userId,
      hashedPassword
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