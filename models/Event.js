const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  name: String,
  description: String,
  date: Date,
  category: String,
  attendees: [String],
  ownerId: mongoose.Schema.Types.ObjectId,
});

const Event = mongoose.model("Event", EventSchema);
module.exports = Event;
