const Event = require("../models/Event");

const postEvent = async (req, res) => {
  try {
    console.log("Request Headers:", req.headers);
    console.log("Request Body:", req.body);
    const { name, description, date, category } = req.body;

    if (!name || !description || !date || !category) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const newEvent = new Event({
      name,
      description,
      date,
      category,
      ownerId: req.user.id,
      attendees: [],
    });

    await newEvent.save();
    res.json(newEvent);
  } catch (error) {
    console.error("error creating event:", error);
    res.status(500).json({ message: "internal server error" });
  }
};

const getEvents = async (req, res) => {
  const events = await Event.find();
  res.json(events);
};

const updateEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event || event.ownerId.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  Object.assign(event, req.body);
  await event.save();
  res.json(event);
};

const deleteEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event || event.ownerId.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await event.deleteOne();
  res.json({ message: "Event deleted successfully" });
};

module.exports = {
  postEvent,
  getEvents,
  updateEvent,
  deleteEvent,
};
