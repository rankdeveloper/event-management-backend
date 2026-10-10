import express from "express";
const router = express.Router();
import {
  bookTicket,
  getMyTickets,
  getEventTickets,
  checkIn,
} from "../controllers/ticketController.js";
import { authenticateToken } from "../middlewares/authenticate.js";

router.get("/my", authenticateToken, getMyTickets);
router.post("/checkin", authenticateToken, checkIn);
router.post("/:eventId/book", authenticateToken, bookTicket);
router.get("/event/:eventId", authenticateToken, getEventTickets);

export default router;
