const cloudinary = require("../config/cloudinary");

const streamifier = require("streamifier");
const Event = require("../models/Event");

const buildDefaultTicketTypes = (maxAttendees = 100) => [
  {
    name: "General Admission",
    price: 0,
    capacity: Number(maxAttendees) || 100,
  },
];

const normalizeTicketTypes = (event) => {
  const source =
    Array.isArray(event?.ticketTypes) && event.ticketTypes.length
      ? event.ticketTypes
      : buildDefaultTicketTypes(event?.maxAttendees);

  return source.map((ticket) => ({
    name: ticket?.name || "General Admission",
    price: Number(ticket?.price ?? 0),
    capacity: Number(ticket?.capacity ?? event?.maxAttendees ?? 100),
  }));
};

const postEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      location,
      category,
      maxAttendees,
      createdBy,
      ticketTypes,
    } = req.body;
    const imageFile = req.file;

    if (new Date(date) < new Date()) {
      return res
        .status(500)
        .json({ message: "Event Date should not not be in past" });
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
          },
        );
        streamifier.createReadStream(imageFile.buffer).pipe(stream);
      });
    }

    const parsedTicketTypes = ticketTypes ? JSON.parse(ticketTypes) : [];

    const newEvent = new Event({
      title,
      description,
      date,
      location,
      category,
      maxAttendees,
      createdBy,
      image: uploadedImageUrl || null,
      ticketTypes: parsedTicketTypes.length
        ? parsedTicketTypes
        : buildDefaultTicketTypes(maxAttendees),
    });

    await newEvent.save();
    res.json(newEvent);
  } catch (error) {
    console.error("error creating event:", error);
    res.status(500).json({ message: "internal server error" });
  }
};

const getEvents = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;
  const { search, category, sort } = req.query;

  const filter = { date: { $gte: new Date() } };
  if (search) filter.title = { $regex: search, $options: "i" };
  if (category && category !== "All") filter.category = category;

  const sortOption =
    sort === "oldest"
      ? { date: 1 }
      : sort === "popular"
        ? { attendeesCount: -1 }
        : { date: 1 };

  const upComingEvents = await Event.find(filter)
    .sort(sortOption)
    .skip(skip)
    .limit(limit);

  const total = await Event.countDocuments(filter);
  const hasMore = skip + limit < total;

  res.json({
    events: upComingEvents,
    hasMore,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
};

const getOneEvent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    const event = await Event.findById(id)
      .populate("createdBy", "username email pic")
      .populate("attendees", "username email pic");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    event.ticketTypes = normalizeTicketTypes(event);
    await event.save();

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
        .json({ message: "Event Date should  not be in past" });
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
          },
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
      (attendee) => attendee.toString() !== req.user.id,
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

const completedEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    console.log("eventId , ", eventId);
    const { completed } = req.body;

    await Event.findByIdAndUpdate(req.params.id, { completed });
    res.status(200).json({ message: "Event completion status updated" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update event completion", error });
    console.log("Completed error : ", error);
  }
};

// dashboard status

const statsForChart = async (req, res) => {
  try {
    const eventTypes = await Event.aggregate([
      {
        $group: {
          _id: "$category",
          total: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          total: 1,
        },
      },
    ]);

    const completedEvents = await Event.aggregate([
      {
        $match: { completed: true },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
        },
      },
    ]);

    const activeEvents = await Event.aggregate([
      {
        $match: { completed: false },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
        },
      },
    ]);

    const totalAttendees = await Event.aggregate([
      {
        $project: {
          attendeeCount: { $size: "$attendees" },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$attendeeCount" },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
        },
      },
    ]);

    const prevMonthEvents = await Event.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(
              new Date().getFullYear(),
              new Date().getMonth() - 1,
              1,
            ),
            $lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
        },
      },
    ]);

    const totalEvents = await (await Event.find()).length;
    const upComingEvents = await Event.find({ date: { $gte: new Date() } });

    const expiredEvents = await Event.find({ date: { $lt: new Date() } });
    expiredEvents.forEach(async (event) => {
      await Event.findByIdAndUpdate(event._id, { expired: true });
    });
    // console.log("expiredEvents : ", expiredEvents.length)

    res.json({
      totalEvents: totalEvents,
      totalExpiredEvents: expiredEvents.length,
      completedEvents: completedEvents[0]?.total || 0,
      activeEvents: activeEvents[0]?.total || 0,
      totalAttendees: totalAttendees[0]?.total || 0,
      prevMonthEvents: prevMonthEvents[0]?.total || 0,
      upComingEvents,
      eventTypes,
    });
  } catch (error) {
    console.error("Error fetching event statistics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const homeStat = async (req, res) => {
  try {
    const totalEvents = await (await Event.find()).length;
    const completedEvents = await Event.aggregate([
      {
        $match: { completed: true },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
        },
      },
    ]);

    const totalAttendees = await Event.aggregate([
      {
        $project: {
          attendeeCount: { $size: "$attendees" },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$attendeeCount" },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
        },
      },
    ]);

    res.json({
      totalEvents: totalEvents,
      completedEvents: completedEvents[0]?.total || 0,
      totalAttendees: totalAttendees[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

const bookmarkEvent = async (req, res) => {
  try {
    const User = require("../models/User");
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const eventId = req.params.id;
    const isBookmarked = user.bookmarks?.includes(eventId);

    if (isBookmarked) {
      user.bookmarks = user.bookmarks.filter((b) => b.toString() !== eventId);
    } else {
      if (!user.bookmarks) user.bookmarks = [];
      user.bookmarks.push(eventId);
    }
    await user.save();
    res.json({ bookmarked: !isBookmarked, bookmarks: user.bookmarks });
  } catch (error) {
    res.status(500).json({ message: "Error toggling bookmark", error });
  }
};

const getBookmarks = async (req, res) => {
  try {
    const User = require("../models/User");
    const user = await User.findById(req.user.id).populate({
      path: "bookmarks",
      match: { date: { $gte: new Date() } },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ bookmarks: user.bookmarks || [] });
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookmarks", error });
  }
};

const getMyEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const created = await Event.find({ createdBy: userId }).sort({ date: -1 });
    const attending = await Event.find({
      attendees: userId,
      createdBy: { $ne: userId },
    }).sort({ date: -1 });
    res.json({ created, attending });
  } catch (error) {
    res.status(500).json({ message: "Error fetching my events", error });
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
  completedEvent,
  statsForChart,
  homeStat,
  bookmarkEvent,
  getBookmarks,
  getMyEvents,
};
