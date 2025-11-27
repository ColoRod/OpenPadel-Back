const { getCurrentUsuario, getUsuarioById } = require('../models/usuario.model');

exports.getUsuarioActual = async function (req, res) {
  try {
    const user = await getCurrentUsuario();
    res.json(user);
  } catch (err) {
    console.error('Error en getUsuarioActual:', err);
    res.status(500).json({ error: 'Error obteniendo usuario actual' });
  }
};

exports.getUsuario = async function (req, res) {
  const { id } = req.params;
  try {
    const user = await getUsuarioById(id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    console.error('Error en getUsuario:', err);
    res.status(500).json({ error: 'Error obteniendo usuario' });
  }
};
