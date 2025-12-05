import { Router } from "express";
import { register, login, logout } from "../controllers/auth.controllers.js";
import { upload } from '../middlewares/upload.js';

const router = Router();

router.post("/register", upload.single("foto"), register);
router.post("/login", login);
router.post("/logout", logout);

export default router;
