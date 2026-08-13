import db from "../config/db.config.js";

// Buscar usuario por email
export const getUserByEmail = async (email) => {
  const [rows] = await db.query(
    "SELECT * FROM usuarios WHERE email = ?",
    [email]
  );

  return rows[0] || null;
};

// Crear usuario
export const createUser = async ({
  nombre,
  apellido,
  email,
  password,
  dni,
  telefono,
  categoria,
  foto_url
}) => {
  const [result] = await db.query(
    `INSERT INTO usuarios
      (rol, nombre, apellido, email, password, dni, telefono, categoria, foto_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "jugador",
      nombre,
      apellido,
      email,
      password,
      dni,
      telefono,
      categoria,
      foto_url
    ]
  );

  return result.insertId;
};

// Obtener perfil completo
export const getUserProfileById = async (userId) => {
  const [rows] = await db.query(
    `SELECT
       user_id AS id,
       club_id,
       nombre,
       apellido,
       email,
       telefono,
       dni,
       categoria,
       foto_url,
       rol
     FROM usuarios
     WHERE user_id = ?`,
    [userId]
  );

  if (rows.length === 0) {
    return null;
  }

  const userData = rows[0];

  // Buscar club solamente si el usuario es administrador
  if (userData.rol === "admin" && userData.club_id) {
    const [clubRows] = await db.query(
      `SELECT
         club_id,
         nombre,
         imagen_url
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

  return userData;
};

// Obtener solamente la foto actual
export const getUserPhotoById = async (userId) => {
  const [rows] = await db.query(
    "SELECT foto_url FROM usuarios WHERE user_id = ?",
    [userId]
  );

  return rows[0]?.foto_url || null;
};

// Actualizar perfil
export const updateUserProfile = async (
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
) => {
  await db.query(
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
};

// Obtener contraseña actual
export const getUserPasswordById = async (userId) => {
  const [rows] = await db.query(
    "SELECT password FROM usuarios WHERE user_id = ?",
    [userId]
  );

  return rows[0]?.password || null;
};

// Actualizar contraseña
export const updateUserPassword = async (userId, hashedPassword) => {
  await db.query(
    "UPDATE usuarios SET password = ? WHERE user_id = ?",
    [hashedPassword, userId]
  );
};