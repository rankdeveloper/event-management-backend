const express = require("express");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();
const {
  postEvent,
  getEvents,
  updateEvent,
  deleteEvent,
  getOneEvent,
  registerForEvent,
  unregisterFromEvent,
} = require("../controllers/eventControllers");
const { authenticateToken } = require("../middlewares/authenticate");

router.post("/", upload.single("image"), authenticateToken, postEvent);

router.get("/", getEvents);
router.get("/:id", authenticateToken, getOneEvent);
router.put("/:id", authenticateToken, updateEvent);

router.delete("/:id", authenticateToken, deleteEvent);
router.post("/:id/register", authenticateToken, registerForEvent);
router.delete("/:id/register", authenticateToken, unregisterFromEvent);

module.exports = router;
