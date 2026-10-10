import express from "express";
const router = express.Router();
import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() });
import { authenticateToken } from "../middlewares/authenticate.js";
import {
  register,
  login,
  enterMe,
  logout,
  updateUser,
  guestSignIn,
} from "../controllers/userController.js";

router.post("/register", register);

router.post("/login", login);
router.get("/me", authenticateToken, enterMe);
router.post("/logout", logout);
router.put("/update", upload.single("pic"), authenticateToken, updateUser);
router.post("/guest-sign", guestSignIn);

export default router;
