import { Router } from 'express';
import { getProfile, updateProfile, changePassword } from '../controllers/user.controllers.js';
import { verifyToken } from '../middlewares/auth.middlewares.js';
import { upload } from '../middlewares/upload.js';

const router = Router();

router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken,  upload.single("foto"), updateProfile);
router.put(
  '/change-password',
  verifyToken,
  changePassword
);

export default router;
