const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const { authenticateToken } = require("../middlewares/authenticate");
const {
  register,
  login,
  enterMe,
  logout,
  updateUser,
  guestSignIn,
} = require("../controllers/userController");

router.post("/register", register);

router.post("/login", login);
router.get("/me", authenticateToken, enterMe);
router.post("/logout", logout);
router.put("/update", upload.single("pic"), authenticateToken, updateUser);
router.post("/guest-sign", guestSignIn);

module.exports = router;
