const Booking = require("../models/booking");
const Listing = require("../models/listing");

// View user's bookings & booking requests for listing owners
module.exports.index = async (req, res) => {
    // Find all bookings for logged-in user and populate listing details (guest view)
    const bookings = await Booking.find({ user: req.user._id }).populate("listing");
    
    // Find listings owned by logged-in user
    const myListings = await Listing.find({ owner: req.user._id });
    const myListingsIds = myListings.map(listing => listing._id);
    
    // Find bookings for listings owned by logged-in user (owner view)
    const bookingRequests = await Booking.find({ listing: { $in: myListingsIds } })
        .populate("listing")
        .populate("user"); // Populate guest user info
        
    res.render("bookings/index.ejs", { bookings, bookingRequests });
};

// Create a booking
module.exports.createBooking = async (req, res) => {
    let { id } = req.params; // listing id
    let listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    // Check if the current user is trying to book their own listing
    if (listing.owner._id.equals(req.user._id)) {
        req.flash("error", "You cannot book your own listing!");
        return res.redirect(`/listings/${id}`);
    }

    const { startDate, endDate, guests } = req.body.booking;
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
        req.flash("error", "Check-in date cannot be in the past!");
        return res.redirect(`/listings/${id}`);
    }
    if (end <= start) {
        req.flash("error", "Check-out date must be after check-in date!");
        return res.redirect(`/listings/${id}`);
    }

    // Check for overlap booking (ignoring rejected bookings)
    const overlapBookings = await Booking.find({
        listing: id,
        status: { $ne: "rejected" },
        $or: [
            { startDate: { $lte: end }, endDate: { $gte: start } }
        ]
    });

    if (overlapBookings.length > 0) {
        req.flash("error", "This listing is already booked for the selected dates!");
        return res.redirect(`/listings/${id}`);
    }

    // Calculate total price
    const timeDiff = end - start;
    const nights = Math.round(timeDiff / (1000 * 60 * 60 * 24));
    const totalPrice = nights * listing.price;

    const newBooking = new Booking({
        listing: id,
        user: req.user._id,
        startDate: start,
        endDate: end,
        guests: guests,
        totalPrice: totalPrice
    });

    await newBooking.save();
    req.flash("success", "Booking confirmed successfully!");
    res.redirect("/bookings");
};

// Cancel a booking
module.exports.destroyBooking = async (req, res) => {
    let { bookingId } = req.params;
    let booking = await Booking.findById(bookingId).populate("listing");
    if (!booking) {
        req.flash("error", "Booking not found!");
        return res.redirect("/bookings");
    }

    // Check if the current user is either the guest who booked OR the owner of the listing
    const isGuest = booking.user.equals(req.user._id);
    const isOwner = booking.listing && booking.listing.owner.equals(req.user._id);

    if (!isGuest && !isOwner) {
        req.flash("error", "You do not have permission to cancel this booking!");
        return res.redirect("/bookings");
    }

    if (booking.status === "rejected") {
        // If it is already rejected/cancelled, either user removing it will delete it from database
        await Booking.findByIdAndDelete(bookingId);
        req.flash("success", "Reservation removed from dashboard.");
    } else if (isOwner) {
        // If owner cancels an accepted booking, we change its status to rejected and leave a message rather than deleting it.
        booking.status = "rejected";
        booking.message = "The host has cancelled your confirmed reservation.";
        await booking.save();
        req.flash("success", "Reservation cancelled successfully!");
    } else {
        // If guest cancels, we can just delete it from the database.
        await Booking.findByIdAndDelete(bookingId);
        req.flash("success", "Reservation cancelled successfully!");
    }
    res.redirect("/bookings");
};

// Accept a booking request (listing owner only)
module.exports.acceptBooking = async (req, res) => {
    let { bookingId } = req.params;
    let booking = await Booking.findById(bookingId).populate("listing");
    if (!booking) {
        req.flash("error", "Booking request not found!");
        return res.redirect("/bookings");
    }

    // Authorize: Only the listing owner can accept
    if (!booking.listing || !booking.listing.owner.equals(req.user._id)) {
        req.flash("error", "You do not have permission to accept this booking!");
        return res.redirect("/bookings");
    }

    booking.status = "accepted";
    booking.message = "Congratulations! The host has accepted your booking request.";
    await booking.save();
    req.flash("success", "Booking request accepted successfully!");
    res.redirect("/bookings");
};

// Reject a booking request (listing owner only)
module.exports.rejectBooking = async (req, res) => {
    let { bookingId } = req.params;
    let booking = await Booking.findById(bookingId).populate("listing");
    if (!booking) {
        req.flash("error", "Booking request not found!");
        return res.redirect("/bookings");
    }

    // Authorize: Only the listing owner can reject
    if (!booking.listing || !booking.listing.owner.equals(req.user._id)) {
        req.flash("error", "You do not have permission to reject this booking!");
        return res.redirect("/bookings");
    }

    booking.status = "rejected";
    booking.message = "We're sorry. The host has declined your booking request.";
    await booking.save();
    req.flash("success", "Booking request rejected successfully!");
    res.redirect("/bookings");
};
