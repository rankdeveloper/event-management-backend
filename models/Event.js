const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  maxAttendees: {
    type: Number,
    required: true,
    default: 100,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  attendees: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  image: {
    type: String,
  },

  completed: { type: Boolean },
  ticketTypes: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true, default: 0 },
      capacity: { type: Number, required: true },
    },
  ],
});

const Event = mongoose.model("Event", EventSchema);
module.exports = Event;
