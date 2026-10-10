import mongoose from "mongoose";

const TicketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ticketType: { type: String, required: true },
  price: { type: Number, required: true, default: 0 },
  qrData: { type: String, required: true },
  checkedIn: { type: Boolean, default: false },
  checkedInAt: { type: Date },
  bookedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Ticket", TicketSchema);
