import Booking from "../models/booking.js";
import Availability from "../models/availability.js";
import { sendEmail } from "../utils/sendEmail.js";
import User from "../models/user.js"; // (to find the provider’s email)
import Service from "../models/service.js";
import {
  generateManageTokenBundle,
  hashManageToken,
  buildManageBookingUrl,
} from "../utils/manageTokens.js";
import {
  buildCustomerConfirmationEmail,
  buildProviderNotificationEmail,
} from "../utils/bookingEmailTemplates.js";
import { buildGoogleCalendarLink } from "../utils/calendarLinks.js";
import {
  INACTIVE_BOOKING_STATUSES,
  applySchedulingLimitDefaults,
  countBookingsForRanges,
  getEffectiveMaxBookingsPerSlot,
  getProfessionalSchedulingLimits,
  findSlotConflicts,
  normalizeDateOnly,
  normalizeTimeSlot,
  startOfUtcDay,
  startOfUtcWeek,
} from "../utils/scheduling.js";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const sanitizeBookingForCustomer = (booking, extra = {}) => {
  if (!booking) return null;
  const plain =
    typeof booking.toObject === "function"
      ? booking.toObject({ virtuals: false })
      : booking;

  const id = plain._id?.toString?.() ?? plain._id;

  return {
    _id: id,
    id,
    professional: plain.professional,
    service: plain.service,
    customer: plain.customer,
    guestInfo: plain.guestInfo,
    date: plain.date,
    timeSlot: plain.timeSlot,
    status: plain.status,
    paymentOption: plain.paymentOption,
    paymentStatus: plain.paymentStatus,
    amountDue: plain.amountDue,
    amountPaid: plain.amountPaid,
    paidAt: plain.paidAt,
    cancellation: plain.cancellation,
    acceptedAt: plain.acceptedAt,
    completedAt: plain.completedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    ...extra,
  };
};

const findBookingByManageToken = async (token) => {
  if (!token) return null;
  const hashed = hashManageToken(token);
  const now = new Date();

  return Booking.findOne({
    manageToken: hashed,
    $or: [
      { manageTokenExpiresAt: null },
      { manageTokenExpiresAt: { $gt: now } },
    ],
  });
};

const ensurePendingOrAccepted = (booking) => {
  if (!booking) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    throw error;
  }
  if (!["pending", "accepted"].includes(booking.status)) {
    const error = new Error("Only pending or accepted bookings can be modified");
    error.statusCode = 400;
    throw error;
  }
};

const applyCancellation = ({ booking, reason, cancelledBy }) => {
  ensurePendingOrAccepted(booking);
  booking.status = "cancelled";
  booking.cancellation = {
    by: cancelledBy,
    at: new Date(),
    reason,
  };
  return booking;
};

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

const nextDateForDayName = (dayName, referenceDate) => {
  const dayIndex = DAY_NAMES.indexOf(dayName);
  if (dayIndex === -1) return null;

  const start = startOfUtcDay(referenceDate);
  const diff = (dayIndex - start.getUTCDay() + 7) % 7;
  const target = new Date(start);
  target.setUTCDate(target.getUTCDate() + (diff === 0 ? 7 : diff));
  return target;
};

const incrementCount = (map, key) => {
  const current = map.get(key) ?? 0;
  map.set(key, current + 1);
};

const combineDateAndTime = (dateOnly, timeString) => {
  if (!dateOnly || typeof timeString !== "string") return null;
  const [hoursStr, minutesStr] = timeString.split(":");
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  const dateTime = new Date(dateOnly);
  dateTime.setUTCHours(hours, minutes, 0, 0);
  return dateTime;
};

const loadProfessionalLimitsOrFail = async (professionalId) => {
  const limits = await getProfessionalSchedulingLimits(professionalId);
  if (!limits) {
    const error = new Error("Professional not found");
    error.statusCode = 404;
    throw error;
  }
  return applySchedulingLimitDefaults(limits);
};

const minutesUntil = (targetDate, now = new Date()) =>
  Math.floor((targetDate.getTime() - now.getTime()) / 60000);

const validateLeadTimes = ({ limits, normalizedDate, startDateTime, now = new Date() }) => {
  const minutesAhead = minutesUntil(startDateTime, now);
  if (
    limits.minBookingLeadTimeMinutes !== null &&
    limits.minBookingLeadTimeMinutes !== undefined &&
    minutesAhead < limits.minBookingLeadTimeMinutes
  ) {
    const error = new Error(
      `Bookings must be made at least ${limits.minBookingLeadTimeMinutes} minutes in advance.`,
    );
    error.statusCode = 400;
    throw error;
  }

  if (
    limits.maxBookingDaysInAdvance !== null &&
    limits.maxBookingDaysInAdvance !== undefined
  ) {
    const todayStart = startOfUtcDay(now);
    const dayDiff = Math.floor(
      (normalizedDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (dayDiff > limits.maxBookingDaysInAdvance) {
      const error = new Error(
        `Bookings cannot be scheduled more than ${limits.maxBookingDaysInAdvance} days in advance.`,
      );
      error.statusCode = 400;
      throw error;
    }
  }
};

const validateCutoff = ({ cutoffMinutes, actionLabel, startDateTime, now = new Date() }) => {
  if (cutoffMinutes === null || cutoffMinutes === undefined) return;
  const minutesAhead = minutesUntil(startDateTime, now);
  if (minutesAhead < cutoffMinutes) {
    const error = new Error(
      `${actionLabel} must be completed at least ${cutoffMinutes} minutes before the appointment start time.`,
    );
    error.statusCode = 400;
    throw error;
  }
};

const enforceBookingCaps = async ({
  professionalId,
  limits,
  normalizedDate,
  excludeBookingId,
}) => {
  const dayStart = startOfUtcDay(normalizedDate);
  const weekStart = startOfUtcWeek(normalizedDate);
  const { dayCount, weekCount } = await countBookingsForRanges({
    professionalId,
    dayStart,
    weekStart,
    excludeBookingId,
  });

  if (
    limits.maxBookingsPerDay !== null &&
    limits.maxBookingsPerDay !== undefined &&
    dayCount >= limits.maxBookingsPerDay
  ) {
    const error = new Error("This day is fully booked.");
    error.statusCode = 409;
    throw error;
  }

  if (
    limits.maxBookingsPerWeek !== null &&
    limits.maxBookingsPerWeek !== undefined &&
    weekCount >= limits.maxBookingsPerWeek
  ) {
    const error = new Error("This week is fully booked.");
    error.statusCode = 409;
    throw error;
  }
};

// Create a new booking request
export const createBooking = async (req, res) => {
  try {
    const {
      professional,
      service,
      date,
      timeSlot,
      guestInfo,
      name,
      email,
      phone,
      paymentOption = "deposit",
    } = req.body;

    if (!professional || !service || !date || !timeSlot?.start || !timeSlot?.end) {
      return res.status(400).json({ error: "Missing required booking fields" });
    }

    if (!["deposit", "full", "free"].includes(paymentOption)) {
      return res.status(400).json({ error: "Invalid payment option" });
    }

    const serviceDoc = await Service.findById(service).select(
      "title price deposit professional allowFreeReservations",
    );
    if (!serviceDoc) {
      return res.status(404).json({ error: "Service not found" });
    }

    if (String(serviceDoc.professional) !== String(professional)) {
      return res.status(400).json({ error: "Service does not belong to the selected professional" });
    }

    let amountDue = 0;
    let paymentStatus = "requires_payment";
    let paidAt;
    if (paymentOption === "free") {
      if (!serviceDoc.allowFreeReservations) {
        return res
          .status(400)
          .json({ error: "This service does not allow free reservations" });
      }
      amountDue = 0;
      paymentStatus = "paid";
      paidAt = new Date();
    } else if (paymentOption === "full") {
      amountDue = serviceDoc.price;
    } else {
      const depositAmount = serviceDoc.deposit ?? 0;
      amountDue = depositAmount > 0 ? depositAmount : serviceDoc.price;
    }

    const normalizedDate = normalizeDateOnly(date);
    if (!normalizedDate) {
      return res.status(400).json({ error: "Invalid booking date" });
    }

    const normalizedSlot = normalizeTimeSlot(timeSlot);
    if (!normalizedSlot) {
      return res.status(400).json({ error: "Invalid time slot" });
    }

    const schedulingLimits = await loadProfessionalLimitsOrFail(professional);
    const startDateTime = combineDateAndTime(normalizedDate, normalizedSlot.start);
    if (!startDateTime) {
      return res.status(400).json({ error: "Invalid booking start time" });
    }

    try {
      validateLeadTimes({
        limits: schedulingLimits,
        normalizedDate,
        startDateTime,
      });
      await enforceBookingCaps({
        professionalId: professional,
        limits: schedulingLimits,
        normalizedDate,
      });
    } catch (validationError) {
      const statusCode = validationError.statusCode || 400;
      return res.status(statusCode).json({ error: validationError.message });
    }

    const conflict = await findSlotConflicts({
      professionalId: professional,
      date: normalizedDate,
      timeSlot: normalizedSlot,
      maxBookingsPerSlot: getEffectiveMaxBookingsPerSlot(schedulingLimits),
    });

    if (conflict) {
      return res.status(409).json({
        error:
          conflict.type === "booking"
            ? "Selected time slot has reached its capacity. Please choose another time."
            : "Selected time slot is no longer available. Please choose another time.",
      });
    }

    const manageTokenBundle = generateManageTokenBundle();

    const bookingData = {
      professional,
      service,
      date: normalizedDate,
      timeSlot: normalizedSlot,
      status: "accepted",
      acceptedAt: new Date(),
      paymentOption,
      amountDue,
      amountPaid: 0,
      paymentStatus,
      manageToken: manageTokenBundle.hashed,
      manageTokenCreatedAt: manageTokenBundle.createdAt,
      manageTokenExpiresAt: manageTokenBundle.expiresAt,
    };

    if (paidAt) {
      bookingData.paidAt = paidAt;
    }

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
    const manageBookingUrl = buildManageBookingUrl(manageTokenBundle.raw);
    const manageRescheduleUrl = `${manageBookingUrl}?action=reschedule`;
    const manageCancelUrl = `${manageBookingUrl}?action=cancel`;
    const serviceTitle = serviceDoc?.title || "Selected service";
    // Send confirmation emails
    try {
      // --- Fetch provider info ---
      const provider = await User.findById(professional).select("name email");

      // --- Determine client info ---
      const clientName = req.user?.name || bookingData.guestInfo?.name;
      const clientEmail = req.user?.email || bookingData.guestInfo?.email;

      // --- Build shared details ---
      const formattedDate = new Date(date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const timeRange = `${timeSlot.start} - ${timeSlot.end}`;

      const startDateTime = combineDateAndTime(normalizedDate, timeSlot.start);
      const endDateTime = combineDateAndTime(normalizedDate, timeSlot.end);

      const googleCalendarUrl = buildGoogleCalendarLink({
        startDate: startDateTime,
        endDate: endDateTime,
        title: serviceTitle,
        description: `Booking with ${provider?.name || "your professional"}`,
      });

      // --- Email to Client ---
      const clientEmailContent = buildCustomerConfirmationEmail({
        clientName,
        providerName: provider?.name,
        serviceTitle,
        formattedDate,
        timeRange,
        googleCalendarUrl,
        manageUrl: manageBookingUrl,
        manageRescheduleUrl,
        manageCancelUrl,
        manageToken: manageTokenBundle.raw,
      });

      const emailTransportConfigured =
        Boolean(process.env.EMAIL_USER) && Boolean(process.env.EMAIL_PASS);
      const fallbackAddress = "team.haastia@gmail.com";
      const resolveRecipient = (preferred) =>
        emailTransportConfigured && preferred ? preferred : fallbackAddress;

      await sendEmail(
        resolveRecipient(clientEmail),
        clientEmailContent.subject,
        clientEmailContent.text,
        clientEmailContent.html,
      );

      // --- Email to Provider ---
      if (provider?.email) {
        const providerEmailContent = buildProviderNotificationEmail({
          providerName: provider?.name,
          clientName,
          clientEmail,
          formattedDate,
          timeRange,
          serviceTitle,
          googleCalendarUrl,
          manageUrl: manageBookingUrl,
        });

        await sendEmail(
          resolveRecipient(provider.email),
          providerEmailContent.subject,
          providerEmailContent.text,
          providerEmailContent.html,
        );
      }

      console.log("✅ Booking confirmation emails sent.");
    } catch (emailError) {
      console.error("❌ Error sending booking confirmation emails:", emailError);
    }

    res.json(
      sanitizeBookingForCustomer(booking, {
        manageToken: manageTokenBundle.raw,
        manageUrl: manageBookingUrl,
      }),
    );
  } catch (err) {
    console.error("Error creating booking:", err);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      error: statusCode === 500 ? "Error creating booking" : err.message,
    });
  }
};


// Return available slots for a professional excluding accepted bookings
export const getAvailableSlotsForProfessional = async (req, res) => {
  try {
    const { id } = req.params;

    const schedulingLimits = await loadProfessionalLimitsOrFail(id);
    const slotCapacity = getEffectiveMaxBookingsPerSlot(schedulingLimits);
    const todayStart = startOfUtcDay(new Date());

    const [availabilityDocs, activeBookings] = await Promise.all([
      Availability.find({ professionalId: id }),
      Booking.find({
        professional: id,
        status: { $nin: INACTIVE_BOOKING_STATUSES },
        date: { $gte: todayStart },
      })
        .select("date timeSlot")
        .lean(),
    ]);

    const slotCounts = new Map();
    const dayCounts = new Map();
    const weekCounts = new Map();

    for (const booking of activeBookings) {
      const dayStart = startOfUtcDay(booking.date);
      const dayKey = dayStart.toISOString();
      const weekKey = startOfUtcWeek(dayStart).toISOString();
      const slotKey = normalizeSlotToString(booking.timeSlot);

      incrementCount(dayCounts, dayKey);
      incrementCount(weekCounts, weekKey);

      if (slotKey) {
        incrementCount(slotCounts, `${dayKey}|${slotKey}`);
      }
    }

    const response = availabilityDocs.map((doc) => {
      const targetDate = nextDateForDayName(doc.day, todayStart);
      if (!targetDate) {
        return { day: doc.day, slots: [] };
      }

      const dayKey = startOfUtcDay(targetDate).toISOString();
      const weekKey = startOfUtcWeek(targetDate).toISOString();
      const dayCount = dayCounts.get(dayKey) ?? 0;
      const weekCount = weekCounts.get(weekKey) ?? 0;

      const dayAtCapacity =
        schedulingLimits.maxBookingsPerDay !== null &&
        schedulingLimits.maxBookingsPerDay !== undefined &&
        dayCount >= schedulingLimits.maxBookingsPerDay;

      const weekAtCapacity =
        schedulingLimits.maxBookingsPerWeek !== null &&
        schedulingLimits.maxBookingsPerWeek !== undefined &&
        weekCount >= schedulingLimits.maxBookingsPerWeek;

      const availableSlots = (doc.slots || [])
        .map(normalizeSlotToString)
        .filter((slot) => {
          if (!slot) return false;
          if (dayAtCapacity || weekAtCapacity) return false;
          const slotKey = `${dayKey}|${slot}`;
          const currentCount = slotCounts.get(slotKey) ?? 0;
          return currentCount < slotCapacity;
        });

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
      .populate("service", "title price deposit")
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
      .populate("service", "title price deposit")
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

    if (status === "accepted" && booking.paymentStatus !== "paid") {
      return res.status(400).json({ error: "Cannot accept booking until payment is completed" });
    }

    if (booking.status !== "pending" && booking.status !== status) {
      return res.status(400).json({ error: "Only pending bookings can be updated" });
    }

    booking.status = status;
    booking.acceptedAt = status === "accepted" ? new Date() : undefined;
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

    const schedulingLimits = await loadProfessionalLimitsOrFail(booking.professional);
    const startDateTime = combineDateAndTime(booking.date, booking.timeSlot?.start);
    if (!startDateTime) {
      return res.status(400).json({ error: "Invalid booking start time" });
    }

    try {
      validateCutoff({
        cutoffMinutes: schedulingLimits.cancelCutoffMinutes,
        actionLabel: "Cancellations",
        startDateTime,
      });
    } catch (validationError) {
      const statusCode = validationError.statusCode || 400;
      return res.status(statusCode).json({ error: validationError.message });
    }

    try {
      applyCancellation({
        booking,
        reason,
        cancelledBy: isProfessional ? "professional" : "customer",
      });
    } catch (validationError) {
      const statusCode = validationError.statusCode || 500;
      return res.status(statusCode).json({ error: validationError.message });
    }

    await booking.save();
    res.json(sanitizeBookingForCustomer(booking));
  } catch (err) {
    console.error("Error cancelling booking:", err);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      error: statusCode === 500 ? "Failed to cancel booking" : err.message,
    });
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

    if (booking.paymentStatus !== "paid") {
      return res.status(400).json({ error: "Cannot complete booking until payment is collected" });
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

export const getBookingByManageToken = async (req, res) => {
  try {
    const booking = await findBookingByManageToken(req.params.token);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json(sanitizeBookingForCustomer(booking));
  } catch (err) {
    console.error("Error fetching booking by token:", err);
    res.status(500).json({ error: "Failed to fetch booking" });
  }
};

export const cancelBookingByManageToken = async (req, res) => {
  try {
    const booking = await findBookingByManageToken(req.params.token);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const schedulingLimits = await loadProfessionalLimitsOrFail(booking.professional);
    const startDateTime = combineDateAndTime(booking.date, booking.timeSlot?.start);
    if (!startDateTime) {
      return res.status(400).json({ error: "Invalid booking start time" });
    }

    try {
      validateCutoff({
        cutoffMinutes: schedulingLimits.cancelCutoffMinutes,
        actionLabel: "Cancellations",
        startDateTime,
      });
    } catch (validationError) {
      const statusCode = validationError.statusCode || 400;
      return res.status(statusCode).json({ error: validationError.message });
    }

    try {
      applyCancellation({ booking, reason: req.body?.reason, cancelledBy: "customer" });
    } catch (validationError) {
      const statusCode = validationError.statusCode || 500;
      return res.status(statusCode).json({ error: validationError.message });
    }

    await booking.save();
    res.json(sanitizeBookingForCustomer(booking));
  } catch (err) {
    console.error("Error cancelling booking by token:", err);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      error: statusCode === 500 ? "Failed to cancel booking" : err.message,
    });
  }
};

export const rescheduleBookingByManageToken = async (req, res) => {
  try {
    const booking = await findBookingByManageToken(req.params.token);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    try {
      ensurePendingOrAccepted(booking);
    } catch (validationError) {
      const statusCode = validationError.statusCode || 500;
      return res.status(statusCode).json({ error: validationError.message });
    }

    const schedulingLimits = await loadProfessionalLimitsOrFail(booking.professional);
    const currentStartDateTime = combineDateAndTime(
      booking.date,
      booking.timeSlot?.start,
    );
    if (!currentStartDateTime) {
      return res.status(400).json({ error: "Invalid booking start time" });
    }

    try {
      validateCutoff({
        cutoffMinutes: schedulingLimits.rescheduleCutoffMinutes,
        actionLabel: "Rescheduling",
        startDateTime: currentStartDateTime,
      });
    } catch (validationError) {
      const statusCode = validationError.statusCode || 400;
      return res.status(statusCode).json({ error: validationError.message });
    }

    const { date, timeSlot } = req.body || {};

    const normalizedDate = normalizeDateOnly(date);
    if (!normalizedDate) {
      return res.status(400).json({ error: "Invalid booking date" });
    }

    const normalizedSlot = normalizeTimeSlot(timeSlot);
    if (!normalizedSlot) {
      return res.status(400).json({ error: "Invalid time slot" });
    }

    const nextStartDateTime = combineDateAndTime(normalizedDate, normalizedSlot.start);
    if (!nextStartDateTime) {
      return res.status(400).json({ error: "Invalid booking start time" });
    }

    try {
      validateLeadTimes({
        limits: schedulingLimits,
        normalizedDate,
        startDateTime: nextStartDateTime,
      });
      await enforceBookingCaps({
        professionalId: booking.professional,
        limits: schedulingLimits,
        normalizedDate,
        excludeBookingId: booking._id,
      });
    } catch (validationError) {
      const statusCode = validationError.statusCode || 400;
      return res.status(statusCode).json({ error: validationError.message });
    }

    const conflict = await findSlotConflicts({
      professionalId: booking.professional,
      date: normalizedDate,
      timeSlot: normalizedSlot,
      excludeBookingId: booking._id,
      maxBookingsPerSlot: getEffectiveMaxBookingsPerSlot(schedulingLimits),
    });

    if (conflict) {
      return res.status(409).json({
        error:
          conflict.type === "booking"
            ? "Selected time slot has reached its capacity."
            : "Selected time slot is no longer available.",
      });
    }

    booking.date = normalizedDate;
    booking.timeSlot = normalizedSlot;
    booking.status = "accepted";
    booking.acceptedAt = new Date();

    await booking.save();
    res.json(sanitizeBookingForCustomer(booking));
  } catch (err) {
    console.error("Error rescheduling booking by token:", err);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      error: statusCode === 500 ? "Failed to reschedule booking" : err.message,
    });
  }
};