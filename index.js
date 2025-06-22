const express = require("express");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const http = require("http");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const eventRoutes = require("./routes/eventRoutes");
const connectDB = require("./config/db");
const cors = require("cors");
const message = require("./models/Message");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});
const allowedOrigins = [
  "http://localhost:5173",
  "https://event-management-fullstack.netlify.app",
];

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true"); // Required for credentials
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Handle preflight requests for all routes
app.options("*", (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.status(204).end();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;
connectDB();

console.log("Cloudinary API Key:", process.env.API_KEY);

app.use("/user", userRoutes);
app.use("/events", eventRoutes);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_room", async (eventId) => {
    socket.join(eventId);
    console.log(`User joined room: ${eventId}`);
    const messages = await message.find({ eventId }).sort({ timestamp: 1 });
    socket.emit("previous_messages", messages);
  });

  socket.on("send_message", async (data) => {
    const messageData = {
      ...data,
      timestamp: new Date().toISOString(),
    };

    try {
      const saveMessage = await message.create(messageData);
      io.to(data.eventId).emit("receive_message", saveMessage);
      console.log("Message sent:", messageData);
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
