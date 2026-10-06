const express = require("express");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();
const {
  postEvent,
  getEvents,
  updateEvent,
  completedEvent,
  deleteEvent,
  getOneEvent,
  registerForEvent,
  unregisterFromEvent,
  statsForChart,
  homeStat,
  bookmarkEvent,
  getBookmarks,
  getMyEvents,
} = require("../controllers/eventControllers");
const { authenticateToken } = require("../middlewares/authenticate");

router.get("/home-stat", homeStat);
router.get("/stats", statsForChart);
router.get("/my-events", authenticateToken, getMyEvents);
router.get("/bookmarks", authenticateToken, getBookmarks);
router.get("/", getEvents);

router.post("/", upload.single("image"), authenticateToken, postEvent);
router.get("/:id", authenticateToken, getOneEvent);
router.put("/:id", upload.single("image"), authenticateToken, updateEvent);
router.put("/completed/:id", authenticateToken, completedEvent);
router.post("/:id/bookmark", authenticateToken, bookmarkEvent);
router.delete("/:id", authenticateToken, deleteEvent);
router.post("/:id/register", authenticateToken, registerForEvent);
router.delete("/:id/register", authenticateToken, unregisterFromEvent);

module.exports = router;
