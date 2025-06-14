const cloudinary = require("../config/cloudinary");

const streamifier = require("streamifier");
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
    const imageFile = req.file;

    if (new Date(date) < new Date()) {
      return res
        .status(500)
        .json({ message: "Event Date should not not be in past" });
      return;
    }

    if (
      !title ||
      !description ||
      !date ||
      !location ||
      !category ||
      !createdBy ||
      !imageFile
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let uploadedImageUrl = null;

    if (imageFile) {
      uploadedImageUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.unsigned_upload_stream(
          "events",
          {},
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
        streamifier.createReadStream(imageFile.buffer).pipe(stream);
      });
    }

    const newEvent = new Event({
      title,
      description,
      date,
      location,
      category,
      maxAttendees,
      createdBy,
      image: uploadedImageUrl || null,
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

    const event = await Event.findById(id)
      .populate("createdBy", "username email")
      .populate("attendees", "username email");

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
  if (!event || event.createdBy.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  console.log("req data ", req);

  try {
    const {
      title,
      description,
      date,
      location,
      category,
      maxAttendees,
      createdBy,
    } = req.body;
    const imageFile = req.file;

    if (new Date(date) < new Date()) {
      return res
        .status(500)
        .json({ message: "Event Date should not not be in past" });
      return;
    }

    if (
      !title ||
      !description ||
      !date ||
      !location ||
      !category ||
      !createdBy ||
      !imageFile
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let uploadedImageUrl = null;

    if (imageFile) {
      uploadedImageUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.unsigned_upload_stream(
          "events",
          {},
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
        streamifier.createReadStream(imageFile.buffer).pipe(stream);
      });
    }

    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, {
      title,
      description,
      date,
      location,
      category,
      maxAttendees,
      createdBy,
      image: uploadedImageUrl || null,
    });

    const newEvent = await updatedEvent.save();

    res.json(newEvent);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

const deleteEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event || event.createdBy.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await event.deleteOne();
  res.json({ message: "Event deleted successfully" });
};

const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.attendees.includes(req.user.id)) {
      return res
        .status(400)
        .json({ message: "Already registered for this event" });
    }

    if (event.attendees.length >= event.maxAttendees) {
      return res.status(400).json({ message: "Event is full" });
    }

    event.attendees.push(req.user.id);
    await event.save();

    const updatedEvent = await Event.findById(req.params.id)
      .populate("createdBy", "username")
      .populate("attendees", "username");

    res.json(updatedEvent);
  } catch (error) {
    console.error("Error registering for event:", error);
    res.status(500).json({ message: "Error registering for event" });
  }
};
const unregisterFromEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (!event.attendees.includes(req.user.id)) {
      return res.status(400).json({ message: "Not registered for this event" });
    }

    event.attendees = event.attendees.filter(
      (attendee) => attendee.toString() !== req.user.id
    );
    await event.save();

    const updatedEvent = await Event.findById(req.params.id)
      .populate("createdBy", "username")
      .populate("attendees", "username");

    res.json(updatedEvent);
  } catch (error) {
    console.error("Error unregistering from event:", error);
    res.status(500).json({ message: "Error unregistering from event" });
  }
};

module.exports = {
  postEvent,
  getEvents,
  updateEvent,
  deleteEvent,
  getOneEvent,
  registerForEvent,
  unregisterFromEvent,
};
