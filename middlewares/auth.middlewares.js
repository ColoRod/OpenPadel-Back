import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  console.log("🔐 verifyToken - Authorization header:", req.headers.authorization);
  console.log("🔐 verifyToken - Token extraído:", token ? "✓ Presente" : "✗ No presente");

  if (!token)
    return res.status(401).json({ message: 'Token no proporcionado' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔐 verifyToken - Token decodificado:", decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.log("🔐 verifyToken - Error al verificar token:", err.message);
    return res.status(403).json({ message: 'Token inválido' });
  }
};
