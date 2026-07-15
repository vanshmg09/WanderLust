const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsyc.js");
const { isLoggedIn } = require("../middleware.js");
const bookingController = require("../controllers/bookings.js");

// GET /bookings (dashboard view)
router.get("/", isLoggedIn, wrapAsync(bookingController.index));

// DELETE /bookings/:bookingId (cancellation)
router.delete("/:bookingId", isLoggedIn, wrapAsync(bookingController.destroyBooking));

// POST /bookings/:bookingId/accept (Accept booking request)
router.post("/:bookingId/accept", isLoggedIn, wrapAsync(bookingController.acceptBooking));

// POST /bookings/:bookingId/reject (Reject booking request)
router.post("/:bookingId/reject", isLoggedIn, wrapAsync(bookingController.rejectBooking));

module.exports = router;
