import { v4 as uuidv4 } from "uuid";
import Ticket from "../models/Ticket.js";
import Event from "../models/Event.js";

const bookTicket = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { ticketType } = req.body;
    const userId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (new Date(event.date) < new Date())
      return res.status(400).json({ message: "Event has already passed" });

    const typeDef = event.ticketTypes?.find((t) => t.name === ticketType);
    if (!typeDef)
      return res.status(400).json({ message: "Invalid ticket type" });

    const existing = await Ticket.findOne({ event: eventId, user: userId });
    if (existing)
      return res
        .status(400)
        .json({ message: "You already have a ticket for this event" });

    const soldCount = await Ticket.countDocuments({
      event: eventId,
      ticketType,
    });
    if (soldCount >= typeDef.capacity)
      return res
        .status(400)
        .json({ message: `${ticketType} tickets are sold out` });

    const ticketId = uuidv4();
    const qrData = JSON.stringify({ ticketId, eventId, userId });

    const ticket = await Ticket.create({
      ticketId,
      event: eventId,
      user: userId,
      ticketType,
      price: typeDef.price,
      qrData,
    });

    if (!event.attendees.includes(userId)) {
      event.attendees.push(userId);
      await event.save();
    }

    const populated = await Ticket.findById(ticket._id)
      .populate("event", "title date location image category")
      .populate("user", "username email");

    res.status(201).json(populated);
  } catch (error) {
    console.error("bookTicket error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user.id })
      .populate("event", "title date location image category")
      .sort({ bookedAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getEventTickets = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.createdBy.toString() !== req.user.id)
      return res.status(403).json({ message: "Forbidden" });

    const tickets = await Ticket.find({ event: req.params.eventId })
      .populate("user", "username email pic")
      .sort({ bookedAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const checkIn = async (req, res) => {
  try {
    const { ticketId } = req.body;
    const ticket = await Ticket.findOne({ ticketId }).populate("event");
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    if (ticket.event.createdBy.toString() !== req.user.id)
      return res
        .status(403)
        .json({ message: "Only the organizer can check in attendees" });

    if (ticket.checkedIn)
      return res
        .status(400)
        .json({ message: "Ticket already checked in", ticket });

    ticket.checkedIn = true;
    ticket.checkedInAt = new Date();
    await ticket.save();

    const populated = await Ticket.findById(ticket._id)
      .populate("user", "username email pic")
      .populate("event", "title date location");

    res.json({ message: "Checked in successfully", ticket: populated });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export { bookTicket, getMyTickets, getEventTickets, checkIn };
