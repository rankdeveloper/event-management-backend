const express = require("express");
const router = express.Router();
const {
  postEvent,
  getEvents,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventControllers");
const { authenticateToken } = require("../middlewares/authenticate");

router.post("/", authenticateToken, postEvent);

router.get("/", getEvents);

router.put("/:id", authenticateToken, updateEvent);

router.delete("/:id", authenticateToken, deleteEvent);

module.exports = router;
