import Booking from "../models/booking.js";
import Availability from "../models/availability.js";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const normalizeSlotToString = (slot) => {
  if (!slot) return null;
  if (typeof slot === "string") return slot;
  if (slot.start && slot.end) return `${slot.start}-${slot.end}`;
  return null;
};

const dayNameFromDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const index = date.getUTCDay();
  return DAY_NAMES[index] ?? null;
};

// Create a new booking request
export const createBooking = async (req, res) => {
  try {
    const { professional, service, date, timeSlot, guestInfo, name, email, phone } = req.body;

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

    if (req.user?._id) {
      bookingData.customer = req.user._id;
    } else {
      const normalizedGuest =
        guestInfo ??
        (name || email || phone ? { name: name || "", email: email || "", phone: phone || "" } : null);

      if (!normalizedGuest || !normalizedGuest.name || !normalizedGuest.email || !normalizedGuest.phone) {
        return res.status(400).json({ error: "Guest info or user required" });
      }
      bookingData.guestInfo = normalizedGuest;
    }

    const booking = await new Booking(bookingData).save();
    res.json(booking);
  } catch (err) {
    console.error("Error creating booking:", err);
    res.status(500).json({ error: "Error creating booking" });
  }
};


// Return available slots for a professional excluding accepted bookings
export const getAvailableSlotsForProfessional = async (req, res) => {
  try {
    const { id } = req.params;

    const [availabilityDocs, acceptedBookings] = await Promise.all([
      Availability.find({ professionalId: id }),
      Booking.find({ professional: id, status: "accepted" }),
    ]);

    const bookedByDay = new Map();

    for (const booking of acceptedBookings) {
      const start = booking?.timeSlot?.start;
      const end = booking?.timeSlot?.end;
      if (!start || !end) continue;

      const dayName = dayNameFromDate(booking.date);
      if (!dayName) continue;

      if (!bookedByDay.has(dayName)) bookedByDay.set(dayName, new Set());
      bookedByDay.get(dayName).add(`${start}-${end}`);
    }

    const response = availabilityDocs.map((doc) => {
      const bookedForDay = bookedByDay.get(doc.day) ?? new Set();

      const availableSlots = (doc.slots || [])
        .map(normalizeSlotToString)
        .filter((slot) => slot && !bookedForDay.has(slot));

      return {
        day: doc.day,
        slots: availableSlots,
      };
    });

    res.json(response);
  } catch (err) {
    console.error("Error fetching available slots:", err);
    res.status(500).json({ error: "Failed to fetch available slots" });
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

// Professional can accept/decline pending bookings
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "accepted" | "declined"

    if (!["accepted", "declined"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    // must be the owner (professional)
    const booking = await Booking.findOne({ _id: id, professional: req.user._id });
    if (!booking) return res.status(404).json({ error: "Booking not found or unauthorized" });

    if (booking.status !== "pending") {
      return res.status(400).json({ error: "Only pending bookings can be updated" });
    }

    booking.status = status;
    await booking.save();

    res.json(booking);
  } catch (err) {
    console.error("Error updating booking status:", err);
    res.status(500).json({ error: "Failed to update booking status" });
  }
};

// Cancel (either professional or customer) when pending/accepted
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const isProfessional = String(booking.professional) === String(req.user?._id);
    const isCustomer = booking.customer && String(booking.customer) === String(req.user?._id);

    if (!isProfessional && !isCustomer) {
      return res.status(403).json({ error: "Not authorized to cancel this booking" });
    }

    if (!["pending", "accepted"].includes(booking.status)) {
      return res.status(400).json({ error: "Only pending or accepted bookings can be cancelled" });
    }

    booking.status = "cancelled";
    booking.cancellation = {
      by: isProfessional ? "professional" : "customer",
      at: new Date(),
      reason,
    };

    await booking.save();
    res.json(booking);
  } catch (err) {
    console.error("Error cancelling booking:", err);
    res.status(500).json({ error: "Failed to cancel booking" });
  }
};

// Complete (professional only) when accepted
export const completeBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findOne({ _id: id, professional: req.user._id });
    if (!booking) return res.status(404).json({ error: "Booking not found or unauthorized" });

    if (booking.status !== "accepted") {
      return res.status(400).json({ error: "Only accepted bookings can be completed" });
    }

    booking.status = "completed";
    booking.completedAt = new Date();
    await booking.save();

    res.json(booking);
  } catch (err) {
    console.error("Error completing booking:", err);
    res.status(500).json({ error: "Failed to complete booking" });
  }
};