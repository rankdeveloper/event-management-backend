const express = require("express");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const http = require("http");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const eventRoutes = require("./routes/eventRoutes");
const connectDB = require("./config/db");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;
connectDB();

app.use("/user", userRoutes);
app.use("/events", eventRoutes);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
