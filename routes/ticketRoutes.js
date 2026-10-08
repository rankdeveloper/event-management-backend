const express = require("express");
const router = express.Router();
const {
  bookTicket,
  getMyTickets,
  getEventTickets,
  checkIn,
} = require("../controllers/ticketController");
const { authenticateToken } = require("../middlewares/authenticate");

router.get("/my", authenticateToken, getMyTickets);
router.post("/checkin", authenticateToken, checkIn);
router.post("/:eventId/book", authenticateToken, bookTicket);
router.get("/event/:eventId", authenticateToken, getEventTickets);

module.exports = router;
