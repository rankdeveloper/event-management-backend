const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/authenticate");
const { register, login } = require("../controllers/userController");

router.post("/register", register);

router.post("/login", login);
router.get("/me", authenticateToken, getMe);
router.post("/logout", logout);

module.exports = router;
