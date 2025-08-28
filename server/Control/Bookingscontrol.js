import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import { Stripe } from 'stripe';

export const checkavailabilty = async (showId, selectedSeats) => {
    try {
        const show = await Show.findById(showId);
        if (!show) { return false; }
        const occupiedSeats = show.occupiedSeats;
        const isSeatTaken = selectedSeats.some((seat) => occupiedSeats[seat]);
        return !isSeatTaken;
    } catch (error) {
        console.log(error);
        return false;
    }
};

export const createBooking = async (req, res) => {
    try {
        const { userId } = req.auth;
        const { showId, selectedSeats } = req.body;
        const origin = req.headers.origin;

        const isAvailable = await checkavailabilty(showId, selectedSeats);
        if (!isAvailable) {
            return res.json({ success: false, message: "Selected seats are not available" });
        }
        const show = await Show.findById(showId).populate('movie');
        const booking = await Booking.create({
            user: userId,
            show: showId,
            amount: show.showprice * selectedSeats.length,
            bookedseats: selectedSeats
        });
        selectedSeats.forEach((seat) => {
            return show.occupiedSeats[seat] = true;
        });
        show.markModified('occupiedSeats');
        await show.save();

        const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
        const conversionRate = 86;
        const inrAmount = booking.amount;
        const usdAmount = inrAmount / conversionRate;
        const unitAmountInCents = Math.floor(usdAmount * 100);

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/my-bookings?payment_status=success`,
            cancel_url: `${origin}/my-bookings?payment_status=cancelled`,
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: { name: show.movie.originalTitle },
                    unit_amount: unitAmountInCents,
                },
                quantity: 1,
            }],
            mode: 'payment',
            metadata: { bookingId: booking._id.toString() },
        });
        booking.paymentLink = session.url;
        await booking.save();
        
        res.json({ success: true, url: session.url });
    } catch (error) {
        console.error("Stripe session error:", error);
        res.json({ success: false, message: error.message });
    }
};

export const getoccupiedSeats = async (req, res) => {
    try {
        const { showId } = req.params;
        const showdata = await Show.findById(showId);
        const occupiedSeats = Object.keys(showdata.occupiedSeats);
        res.json({ success: true, occupiedSeats });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const repayBooking = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const origin = req.headers.origin;
        const booking = await Booking.findById(bookingId).populate({
            path: 'show',
            populate: { path: 'movie' }
        });

        if (!booking) return res.status(404).json({ success: false, message: "Booking not found." });
        if (booking.isPaid) return res.status(400).json({ success: false, message: "This booking has already been paid for." });

        const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
        const conversionRate = 86;
        const inrAmount = booking.amount;
        const usdAmount = inrAmount / conversionRate;
        const unitAmountInCents = Math.floor(usdAmount * 100);

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/my-bookings?payment_status=success`,
            cancel_url: `${origin}/my-bookings?payment_status=cancelled`,
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: { name: booking.show.movie.originalTitle },
                    unit_amount: unitAmountInCents,
                },
                quantity: 1,
            }],
            mode: 'payment',
            metadata: { bookingId: booking._id.toString() },
        });
        
        booking.paymentLink = session.url;
        await booking.save();
        res.json({ success: true, url: session.url });
    } catch (error) {
        console.error("Repay session error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- ADD THIS ENTIRE FUNCTION TO Bookingscontrol.js ---

export const checkUnpaidBooking = async (req, res) => {
  try {
    const { userId } = req.auth;
    // The frontend will send us an array of all possible show IDs for that day
    const { showIds } = req.body;

    if (!showIds || showIds.length === 0) {
      return res.json({ success: true, hasUnpaidBooking: false });
    }

    // Find if a booking exists for this user that is unpaid and for one of the shows on this day
    const unpaidBooking = await Booking.findOne({
      user: userId,
      show: { $in: showIds }, // Check if the booking's show ID is in the array we provided
      isPaid: false
    });

    // Send back true if we found one, false otherwise
    res.json({ success: true, hasUnpaidBooking: !!unpaidBooking }); // (!! converts the result to a boolean)

  } catch (error) {
    console.error("Error checking for unpaid booking:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};