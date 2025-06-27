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
} = require("../controllers/eventControllers");
const { authenticateToken } = require("../middlewares/authenticate");

//dashboard
router.get("/home-stat", homeStat);
router.get("/stats", statsForChart);
router.post("/", upload.single("image"), authenticateToken, postEvent);

router.get("/", getEvents);
router.get("/:id", authenticateToken, getOneEvent);
router.put("/:id", upload.single("image"), authenticateToken, updateEvent);
router.put("/completed/:id", authenticateToken, completedEvent);

router.delete("/:id", authenticateToken, deleteEvent);
router.post("/:id/register", authenticateToken, registerForEvent);
router.delete("/:id/register", authenticateToken, unregisterFromEvent);

module.exports = router;
