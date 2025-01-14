const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/authenticate");
const {
  register,
  login,
  enterMe,
  logout,
} = require("../controllers/userController");

router.post("/register", register);

router.post("/login", login);
router.get("/me", authenticateToken, enterMe);
router.post("/logout", logout);

module.exports = router;
