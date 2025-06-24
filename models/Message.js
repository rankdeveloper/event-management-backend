const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  eventId: { type: String, required: true },
  sender: { type: String, required: true },
  message: { type: String, required: true },
  profilePic: { type: String },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", messageSchema);
