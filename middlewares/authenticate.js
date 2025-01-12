const jwt = require("jsonwebtoken");
require("dotenv").config();

function authenticateToken(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(token, process.env.secret_key_jwt, (err, user) => {
    if (err)
      return res.status(403).json({ message: "user dont have persmission" });
    req.user = user;
    next();
  });
}

module.exports = { authenticateToken };
