const express = require("express");
const router = express.Router();
const {
  postEvent,
  getEvents,
  updateEvent,
  deleteEvent,
  getOneEvent,
} = require("../controllers/eventControllers");
const { authenticateToken } = require("../middlewares/authenticate");

router.post("/", authenticateToken, postEvent);

router.get("/", getEvents);
router.get("/:id", authenticateToken, getOneEvent);
router.put("/:id", authenticateToken, updateEvent);

router.delete("/:id", authenticateToken, deleteEvent);

module.exports = router;
