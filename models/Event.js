const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  category: { type: String, required: true },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

const Event = mongoose.model("Event", EventSchema);
module.exports = Event;
