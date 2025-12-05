import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/user.controllers.js';
import { verifyToken } from '../middlewares/auth.middlewares.js';
import { upload } from '../middlewares/upload.js';

const router = Router();

router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken,  upload.single("foto"), updateProfile);

export default router;
