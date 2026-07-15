const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsyc.js");
const { isLoggedIn, validateBooking } = require("../middleware.js");
const bookingController = require("../controllers/bookings.js");

// POST /listings/:id/bookings
router.post("/", isLoggedIn, validateBooking, wrapAsync(bookingController.createBooking));

module.exports = router;
