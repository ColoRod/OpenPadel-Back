const express = require('express');
const { getClubes } = require('../controllers/clubesController');

const router = express.Router();

// Obtener todos los clubes
router.get('/', getClubes);

module.exports = router;
