import Booking from "../models/booking.js";
import Availability from "../models/availability.js";

// Create a new booking request
export const createBooking = async (req, res) => {
  console.log('creating')
  try {
    const { professional, service, date, timeSlot, guestInfo } = req.body;

    if (!professional || !service || !date || !timeSlot?.start || !timeSlot?.end) {
      return res.status(400).json({ error: "Missing required booking fields" });
    }

    const bookingData = {
      professional,
      service,
      date,
      timeSlot,
      status: "pending",
    };
    console.log('req.user', req.user);
    if (req.user?._id) {
      bookingData.customer = req.user._id;
      console.log(bookingData.customer)
    } else if (guestInfo) {
      bookingData.guestInfo = guestInfo;
    } else {
      return res.status(400).json({ error: "Guest info or user required" });
    }

    const booking = await new Booking(bookingData).save();
    res.json(booking);
  } catch (err) {
    console.error("Error creating booking:", err);
    res.status(500).json({ error: "Error creating booking" });
  }
};

// Get all bookings for a professional
export const getBookingsForProfessional = async (req, res) => {
  try {
    const bookings = await Booking.find({ professional: req.params.id })
      .populate("customer", "name email")
      .populate("service", "title price")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
};

// Get all bookings for a customer
export const getBookingsForCustomer = async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.params.id })
      .populate("professional", "name location")
      .populate("service", "title price")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
};

// Accept or decline a booking
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["accepted", "declined"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    booking.status = status;
    await booking.save();

    res.json(booking);
  } catch (err) {
    console.error("Error updating booking status:", err);
    res.status(500).json({ error: "Failed to update booking status" });
  }
};
