const Event = require("../models/Event");

const postEvent = async (req, res) => {
  try {
    console.log("Request Headers:", req.headers);
    console.log("Request Body:", req.body);
    const {
      title,
      description,
      date,
      location,
      category,
      maxAttendees,
      createdBy,
    } = req.body;

    if (
      !title ||
      !description ||
      !date ||
      !location ||
      !category ||
      !createdBy
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const newEvent = new Event({
      title,
      description,
      date,
      location,
      category,
      maxAttendees,
      createdBy,
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

const getOneEvent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ message: "Internal server error" });
  }
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
  getOneEvent,
};
