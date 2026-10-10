import express from "express";
import { Server } from "socket.io";
import http from "http";

import cron from "node-cron";
import userRoutes from "./routes/userRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import connectDB from "./config/db.js";
import cors from "cors";
import Message from "./models/Message.js";
import { sendEmail } from "./cron.js";
import "dotenv/config";

const app = express();
const server = http.createServer(app);
const origin =
  process.env.NODE_ENV === "production"
    ? "https://rank-evenza.vercel.app"
    : "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: origin,
    methods: ["GET", "POST"],
  },
});
const allowedOrigins = [
  "http://localhost:5173",
  "https://rank-evenza.vercel.app",
];

app.use(
  cors({
    origin: function (requestOrigin, callback) {
      if (!requestOrigin || allowedOrigins.includes(requestOrigin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;
connectDB();

cron.schedule("0 0 * * *", () => {
  sendEmail();
  console.log("cron job done");
});

app.use("/user", userRoutes);
app.use("/events", eventRoutes);
app.use("/tickets", ticketRoutes);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_room", async (eventId) => {
    socket.join(eventId);
    console.log(`User joined room: ${eventId}`);
    const messages = await Message.find({ eventId }).sort({ timestamp: 1 });
    socket.emit("previous_messages", messages);
  });

  socket.on("send_message", async (data) => {
    const messageData = {
      ...data,
      timestamp: new Date().toISOString(),
    };

    try {
      const saveMessage = await Message.create(messageData);
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
