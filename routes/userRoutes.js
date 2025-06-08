const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/authenticate");
const {
  register,
  login,
  enterMe,
  logout,
  updateUser,
} = require("../controllers/userController");

router.post("/register", register);

router.post("/login", login);
router.get("/me", authenticateToken, enterMe);
router.post("/logout", logout);
router.put("/update", authenticateToken, updateUser);

module.exports = router;
