const jwt = require("jsonwebtoken");
require("dotenv").config();

function authenticateToken(req, res, next) {
  console.log("Authenticated user:", req.user); // Check if req.user is set
  console.log("Request body:", req.body); // Check incoming data

  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(token, process.env.secret_key_jwt, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "user dont have persmission" });
    }
    console.log("Authenticated user:", user);
    req.user = user;
    next();
  });
}

module.exports = { authenticateToken };
