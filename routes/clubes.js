import express from 'express';
import { getClubes } from '../controllers/clubesController.js';

const router = express.Router();

// Obtener todos los clubes
router.get('/', getClubes);

export default router;
