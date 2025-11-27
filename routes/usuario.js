const express = require('express');
const { getUsuarioActual, getUsuario } = require('../controllers/usuarioController');

const router = express.Router();

// Datos del usuario actual (mock / auth pendiente)
router.get('/', getUsuarioActual);

// Obtener datos de un usuario por id
router.get('/:id', getUsuario);

module.exports = router;
