import mongoose from "mongoose";
import User from "../models/user.js";
import Availability from "../models/availability.js";
import Booking from "../models/booking.js";
import ClientNote from "../models/clientNote.js";

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const normalizeEmail = (value) => (typeof value === "string" ? value.trim().toLowerCase() : null);
const normalizePhone = (value) => (typeof value === "string" ? value.replace(/\D/g, "") : null);

const buildGuestKeyForBooking = (booking) => {
  const guestInfo = booking.guestInfo || {};
  const email = normalizeEmail(guestInfo.email);
  if (email) {
    return `guest:email:${email}`;
  }
  const phone = normalizePhone(guestInfo.phone);
  if (phone) {
    return `guest:phone:${phone}`;
  }
  return `guest:booking:${booking._id.toString()}`;
};

const ensureProfessional = (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return false;
  }
  if (req.user.role !== "professional") {
    res.status(403).json({ error: "Professional access required" });
    return false;
  }
  return true;
};

export const getProfessionalProfile = async (req, res) => {
  try {
    const { id } = req.params; // professionalId
    console.log("looking, ", id);
    const professional = await User.findById(id).select("-password");
    if (!professional) {
      return res.status(404).json({ error: "Professional not found" });
    }
    if (professional.role !== "professional") {
      return res.status(400).json({ error: "User is not a professional" });
    }

    const availability = await Availability.find({ professionalId: id }).sort({ day: 1 });

    return res.json({
      professional,
      availability,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
};

export const listMyCustomers = async (req, res) => {
  if (!ensureProfessional(req, res)) return;

  try {
    const bookings = await Booking.find({ professional: req.user._id })
      .populate("customer", "name email phone image role")
      .sort({ date: -1 })
      .lean();

    const customerMap = new Map();

    bookings.forEach((booking) => {
      const key = booking.customer ? booking.customer._id.toString() : buildGuestKeyForBooking(booking);
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          customerKey: key,
          customerId: booking.customer ? booking.customer._id : null,
          customer: booking.customer || null,
          guestInfo: booking.customer ? null : booking.guestInfo,
          lastBookingDate: new Date(booking.date),
          totalBookings: 0,
        });
      }
      const entry = customerMap.get(key);
      entry.totalBookings += 1;
      const bookingDate = new Date(booking.date);
      if (bookingDate > entry.lastBookingDate) {
        entry.lastBookingDate = bookingDate;
      }
      if (!booking.customer) {
        entry.guestInfo = booking.guestInfo;
      }
    });

    const customers = Array.from(customerMap.values()).sort(
      (a, b) => b.lastBookingDate.getTime() - a.lastBookingDate.getTime()
    );

    return res.json({ customers });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to list customers" });
  }
};

export const getCustomerSummary = async (req, res) => {
  if (!ensureProfessional(req, res)) return;

  try {
    const { customerId } = req.params;
    const isGuest = customerId.startsWith("guest:");

    let customerProfile = null;
    let match = { professional: req.user._id };

    if (isGuest) {
      match = { ...match, customer: null };
    } else {
      if (!isValidObjectId(customerId)) {
        return res.status(400).json({ error: "Invalid customer id" });
      }
      customerProfile = await User.findById(customerId).select("-password");
      if (!customerProfile) {
        return res.status(404).json({ error: "Customer not found" });
      }
      match = { ...match, customer: customerId };
    }

    const bookings = await Booking.find(match)
      .populate("service", "title duration price deposit")
      .sort({ date: -1 })
      .lean();

    const filteredBookings = isGuest
      ? bookings.filter((booking) => buildGuestKeyForBooking(booking) === customerId)
      : bookings;

    if (!filteredBookings.length) {
      return res.status(404).json({ error: "No history found for this customer" });
    }

    const now = new Date();
    const history = filteredBookings.filter(
      (booking) => booking.status !== "pending" || new Date(booking.date) < now
    );

    const guestInfo = isGuest ? filteredBookings[0].guestInfo : null;

    const notes = isGuest
      ? []
      : await ClientNote.find({ professional: req.user._id, customer: customerId })
          .sort({ createdAt: -1 })
          .lean();

    return res.json({
      customer: customerProfile,
      guestInfo,
      notes,
      bookings: history,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch customer summary" });
  }
};

export const createCustomerNote = async (req, res) => {
  if (!ensureProfessional(req, res)) return;

  try {
    const { customerId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Note content is required" });
    }

    if (!isValidObjectId(customerId)) {
      return res.status(400).json({ error: "Invalid customer id" });
    }

    const customerExists = await User.exists({ _id: customerId });
    if (!customerExists) {
      return res.status(404).json({ error: "Customer not found" });
    }

    await ClientNote.create({
      professional: req.user._id,
      customer: customerId,
      content: content.trim(),
    });

    const notes = await ClientNote.find({ professional: req.user._id, customer: customerId })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(201).json({ notes });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to create note" });
  }
};

export const updateCustomerNote = async (req, res) => {
  if (!ensureProfessional(req, res)) return;

  try {
    const { customerId, noteId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Note content is required" });
    }

    if (!isValidObjectId(customerId) || !isValidObjectId(noteId)) {
      return res.status(400).json({ error: "Invalid identifiers" });
    }

    const note = await ClientNote.findOne({
      _id: noteId,
      professional: req.user._id,
      customer: customerId,
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    note.content = content.trim();
    await note.save();

    const notes = await ClientNote.find({ professional: req.user._id, customer: customerId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ notes });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update note" });
  }
};
