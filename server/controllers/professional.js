import mongoose from "mongoose";
import User, { DEFAULT_SCHEDULING_LIMITS } from "../models/user.js";
import Availability from "../models/availability.js";
import Booking from "../models/booking.js";
import BlockedTime from "../models/blockedTime.js";
import ClientNote from "../models/clientNote.js";
import {
  INACTIVE_BOOKING_STATUSES,
  getEffectiveMaxBookingsPerSlot,
  getProfessionalSchedulingLimits,
  startOfUtcDay,
  startOfUtcWeek,
} from "../utils/scheduling.js";

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

const MAX_PROFILE_GUIDELINES_LENGTH = 2000;
const MAX_BIO_LENGTH = 2000;
const MAX_TAGLINE_LENGTH = 120;
const MAX_BUSINESS_ADDRESS_LENGTH = 200;
const MAX_LOCATION_LENGTH = 120;
const MAX_CONTACT_PHONE_LENGTH = 32;
const MAX_WEBSITE_LENGTH = 200;
const SCHEDULING_LIMIT_FIELDS = [
  { key: "minBookingLeadTimeMinutes", label: "Minimum booking lead time (minutes)" },
  { key: "maxBookingDaysInAdvance", label: "Maximum days in advance" },
  { key: "rescheduleCutoffMinutes", label: "Reschedule cutoff (minutes)" },
  { key: "cancelCutoffMinutes", label: "Cancel cutoff (minutes)" },
  { key: "maxBookingsPerSlot", label: "Bookings per slot" },
  { key: "maxBookingsPerDay", label: "Bookings per day" },
  { key: "maxBookingsPerWeek", label: "Bookings per week" },
];

const applySchedulingLimitDefaults = (limits = {}) => {
  const fallback = { ...DEFAULT_SCHEDULING_LIMITS };

  SCHEDULING_LIMIT_FIELDS.forEach(({ key }) => {
    if (limits[key] !== undefined) {
      fallback[key] = limits[key];
    }
  });

  return fallback;
};

const formatProfessionalForResponse = (professionalDoc) => {
  if (!professionalDoc) return null;
  const professional = professionalDoc.toObject ? professionalDoc.toObject() : professionalDoc;
  professional.schedulingLimits = applySchedulingLimitDefaults(professional.schedulingLimits || {});
  return professional;
};

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

const toISODateString = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeSlotRange = (slot) => {
  if (!slot) return null;
  const isString = typeof slot === "string";
  const [rawStart, rawEnd] = isString ? slot.split("-") : [slot?.start, slot?.end];
  const start = typeof rawStart === "string" ? rawStart.trim() : "";
  const end = typeof rawEnd === "string" ? rawEnd.trim() : "";
  if (!start || !end) return null;
  return { start, end };
};

const toMinutes = (time) => {
  if (typeof time !== "string") return null;
  const [hours, minutes] = time.split(":").map(Number);
  if (
    Number.isInteger(hours) &&
    Number.isInteger(minutes) &&
    hours >= 0 &&
    hours < 24 &&
    minutes >= 0 &&
    minutes < 60
  ) {
    return hours * 60 + minutes;
  }
  return null;
};

const subtractInterval = (interval, block) => {
  if (!interval) return [];
  if (!block) return [interval];
  if (block.end <= interval.start || block.start >= interval.end) {
    return [interval];
  }
  const segments = [];
  if (block.start > interval.start) {
    segments.push({ start: interval.start, end: Math.min(block.start, interval.end) });
  }
  if (block.end < interval.end) {
    segments.push({ start: Math.max(block.end, interval.start), end: interval.end });
  }
  return segments.filter((segment) => segment.end > segment.start);
};

const toIntervals = (slots = []) =>
  slots
    .map(normalizeSlotRange)
    .filter(Boolean)
    .map(({ start, end }) => ({
      start: toMinutes(start),
      end: toMinutes(end),
    }))
    .filter((interval) => interval.start !== null && interval.end !== null && interval.end > interval.start);

const normalizeBlocksToIntervals = (blocks = []) =>
  blocks
    .map((block) => {
      const normalized = normalizeSlotRange(block);
      if (!normalized) return null;
      return {
        start: toMinutes(normalized.start),
        end: toMinutes(normalized.end),
      };
    })
    .filter((interval) => interval && interval.start !== null && interval.end !== null && interval.end > interval.start);

const formatMinutes = (value) => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;

const subtractBlocksFromSlots = (slots = [], blocks = []) => {
  const intervals = toIntervals(slots);
  const blockIntervals = normalizeBlocksToIntervals(blocks);
  const reduced = blockIntervals.reduce(
    (current, block) => current.flatMap((interval) => subtractInterval(interval, block)),
    intervals,
  );
  return reduced.map((interval) => ({
    start: formatMinutes(interval.start),
    end: formatMinutes(interval.end),
  }));
};

const incrementCount = (map, key) => {
  const current = map.get(key) ?? 0;
  map.set(key, current + 1);
};

const buildBookingCountMaps = (bookings) => {
  const slotCounts = new Map();
  const dayCounts = new Map();
  const weekCounts = new Map();

  for (const booking of bookings) {
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

  return { slotCounts, dayCounts, weekCounts };
};

const sanitizeSchedulingLimits = (value) => {
  if (value === undefined) {
    return { updates: null, error: null };
  }

  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return { updates: null, error: "Scheduling limits must be an object" };
  }

  const updates = {};

  for (const { key, label } of SCHEDULING_LIMIT_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) {
      continue;
    }

    const raw = value[key];
    if (raw === null || raw === undefined || raw === "") {
      updates[`schedulingLimits.${key}`] = null;
      continue;
    }

    const numericValue = Number(raw);
    if (!Number.isFinite(numericValue) || numericValue < 0) {
      return {
        updates: null,
        error: `${label} must be a non-negative number or null`,
      };
    }

    updates[`schedulingLimits.${key}`] = Math.floor(numericValue);
  }

  return { updates, error: null };
};

const fetchProfessionalProfilePayload = async (professionalId) => {
  const professionalDoc = await User.findById(professionalId).select("-password");
  if (!professionalDoc) {
    return null;
  }

  const professional = formatProfessionalForResponse(professionalDoc);
  const availability = await Availability.find({ professionalId }).sort({ day: 1 });
  return { professional, availability };
};

export const getMyProfessionalProfile = async (req, res) => {
  if (!ensureProfessional(req, res)) return;

  try {
    const payload = await fetchProfessionalProfilePayload(req.user._id);
    if (!payload) {
      return res.status(404).json({ error: "Professional not found" });
    }

    return res.json(payload);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
};

const sanitizeContactPhone = (value) => value.replace(/[^\d+().-\s]/g, "").trim();

const normalizeWebsiteValue = (value) => {
  if (!value) return "";
  const hasProtocol = /^[a-zA-Z]+:\/\//.test(value);
  if (hasProtocol && !/^https?:\/\//i.test(value)) {
    return null;
  }
  const normalized = hasProtocol ? value : `https://${value}`;
  try {
    const url = new URL(normalized);
    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }
    return url.toString();
  } catch (err) {
    return null;
  }
};

export const updateProfessionalProfile = async (req, res) => {
  if (!ensureProfessional(req, res)) return;

  try {
    const updates = {};
    const errors = [];

    const processField = ({ field, label, maxLength, sanitizer }) => {
      if (!Object.prototype.hasOwnProperty.call(req.body, field)) {
        return;
      }
      const value = req.body[field];
      if (typeof value !== "string") {
        errors.push(`${label} must be a string`);
        return;
      }
      const trimmed = value.trim();
      if (maxLength && trimmed.length > maxLength) {
        errors.push(`${label} must be ${maxLength} characters or fewer`);
        return;
      }
      if (sanitizer) {
        const sanitized = sanitizer(trimmed);
        if (sanitized === null) {
          errors.push(`Please enter a valid ${label.toLowerCase()}`);
          return;
        }
        if (maxLength && sanitized.length > maxLength) {
          errors.push(`${label} must be ${maxLength} characters or fewer`);
          return;
        }
        updates[field] = sanitized;
        return;
      }
      updates[field] = trimmed;
    };

    processField({
      field: "profileGuidelines",
      label: "Profile guidelines",
      maxLength: MAX_PROFILE_GUIDELINES_LENGTH,
    });

    processField({
      field: "bio",
      label: "About / bio",
      maxLength: MAX_BIO_LENGTH,
    });

    processField({
      field: "tagline",
      label: "Headline",
      maxLength: MAX_TAGLINE_LENGTH,
    });

    processField({
      field: "businessAddress",
      label: "Business address",
      maxLength: MAX_BUSINESS_ADDRESS_LENGTH,
    });

    processField({
      field: "location",
      label: "Service area",
      maxLength: MAX_LOCATION_LENGTH,
    });

    processField({
      field: "contactPhone",
      label: "Contact phone",
      maxLength: MAX_CONTACT_PHONE_LENGTH,
      sanitizer: (value) => sanitizeContactPhone(value),
    });

    processField({
      field: "website",
      label: "Website",
      maxLength: MAX_WEBSITE_LENGTH,
      sanitizer: normalizeWebsiteValue,
    });

    const { updates: schedulingLimitUpdates, error: schedulingLimitError } =
      sanitizeSchedulingLimits(req.body.schedulingLimits);

    if (schedulingLimitError) {
      errors.push(schedulingLimitError);
    }

    if (schedulingLimitUpdates) {
      Object.assign(updates, schedulingLimitUpdates);
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: errors[0] });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid profile fields provided" });
    }

    const professionalDoc = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
    }).select("-password");

    if (!professionalDoc) {
      return res.status(404).json({ error: "Professional not found" });
    }

    const professional = formatProfessionalForResponse(professionalDoc);
    const availability = await Availability.find({ professionalId: req.user._id }).sort({ day: 1 });

    return res.json({
      professional,
      availability,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update profile" });
  }
};

export const getProfessionalProfile = async (req, res) => {
  try {
    const { id } = req.params; // professionalId
    console.log("looking, ", id);
    const professionalDoc = await User.findById(id).select("-password");
    if (!professionalDoc) {
      return res.status(404).json({ error: "Professional not found" });
    }
    if (professionalDoc.role !== "professional") {
      return res.status(400).json({ error: "User is not a professional" });
    }

    const professional = formatProfessionalForResponse(professionalDoc);
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

    const notesQuery = isGuest
      ? { professional: req.user._id, guestKey: customerId }
      : { professional: req.user._id, customer: customerId };

    const notes = await ClientNote.find(notesQuery).sort({ createdAt: -1 }).lean();

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

    const isGuest = customerId.startsWith("guest:");
    const notePayload = {
      professional: req.user._id,
      content: content.trim(),
    };

    let notesQuery;

    if (isGuest) {
      notePayload.guestKey = customerId;
      notesQuery = { professional: req.user._id, guestKey: customerId };
    } else {
      if (!isValidObjectId(customerId)) {
        return res.status(400).json({ error: "Invalid customer id" });
      }

      const customerExists = await User.exists({ _id: customerId });
      if (!customerExists) {
        return res.status(404).json({ error: "Customer not found" });
      }

      notePayload.customer = customerId;
      notesQuery = { professional: req.user._id, customer: customerId };
    }

    await ClientNote.create(notePayload);

    const notes = await ClientNote.find(notesQuery).sort({ createdAt: -1 }).lean();

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

    if (!isValidObjectId(noteId)) {
      return res.status(400).json({ error: "Invalid identifiers" });
    }

    const isGuest = customerId.startsWith("guest:");

    const noteMatch = {
      _id: noteId,
      professional: req.user._id,
    };

    let notesQuery;

    if (isGuest) {
      noteMatch.guestKey = customerId;
      notesQuery = { professional: req.user._id, guestKey: customerId };
    } else {
      if (!isValidObjectId(customerId)) {
        return res.status(400).json({ error: "Invalid identifiers" });
      }
      noteMatch.customer = customerId;
      notesQuery = { professional: req.user._id, customer: customerId };
    }

    const note = await ClientNote.findOne(noteMatch);

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    note.content = content.trim();
    await note.save();

    const notes = await ClientNote.find(notesQuery).sort({ createdAt: -1 }).lean();

    return res.json({ notes });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update note" });
  }
};

export const getMyCalendarSnapshot = async (req, res) => {
  if (!ensureProfessional(req, res)) return;

  try {
    const professionalId = req.user._id;
    const schedulingLimits = await getProfessionalSchedulingLimits(professionalId);

    if (!schedulingLimits) {
      return res.status(404).json({ error: "Professional not found" });
    }

    const parseWindow = (value, fallback) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) && numeric >= 0 ? Math.floor(numeric) : fallback;
    };

    const lookBackDays = parseWindow(req.query.lookBackDays, 30);
    const lookAheadDays = parseWindow(req.query.lookAheadDays, 180);

    const today = startOfUtcDay(new Date());
    const rangeStart = new Date(today);
    rangeStart.setUTCDate(today.getUTCDate() - lookBackDays);

    const rangeEnd = new Date(today);
    rangeEnd.setUTCDate(today.getUTCDate() + lookAheadDays);

    const rangeEndExclusive = new Date(rangeEnd);
    rangeEndExclusive.setUTCDate(rangeEndExclusive.getUTCDate() + 1);

    const [availabilityDocs, bookings, blockedTimes] = await Promise.all([
      Availability.find({ professionalId }).lean(),
      Booking.find({
        professional: professionalId,
        date: { $gte: rangeStart, $lt: rangeEndExclusive },
      })
        .populate("customer", "name email")
        .populate("service", "title price deposit")
        .sort({ date: 1 })
        .lean(),
      BlockedTime.find({
        professionalId,
        date: { $gte: rangeStart, $lt: rangeEndExclusive },
      })
        .sort({ date: 1, start: 1 })
        .lean(),
    ]);

    const activeBookings = bookings.filter(
      (booking) => !INACTIVE_BOOKING_STATUSES.includes((booking.status || "").toLowerCase()),
    );

    const { slotCounts, dayCounts, weekCounts } = buildBookingCountMaps(activeBookings);
    const slotCapacity = getEffectiveMaxBookingsPerSlot(schedulingLimits);

    const availabilityByDay = new Map();
    availabilityDocs.forEach((doc) => {
      if (!doc?.day) return;
      const normalizedSlots = (doc.slots || []).map(normalizeSlotRange).filter(Boolean);
      if (!normalizedSlots.length) return;
      availabilityByDay.set(doc.day, normalizedSlots);
    });

    const blockedByDate = new Map();
    blockedTimes.forEach((block) => {
      const isoDate = toISODateString(block.date);
      if (!isoDate) return;
      if (!blockedByDate.has(isoDate)) {
        blockedByDate.set(isoDate, []);
      }
      blockedByDate.get(isoDate).push(block);
    });

    const availableSlots = [];
    for (let cursor = new Date(rangeStart); cursor <= rangeEnd; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
      const isoDate = toISODateString(cursor);
      if (!isoDate) continue;
      const dayName = DAY_NAMES[cursor.getUTCDay()];
      const dayAvailability = availabilityByDay.get(dayName);
      if (!dayAvailability?.length) continue;

      const dayKey = startOfUtcDay(cursor).toISOString();
      const weekKey = startOfUtcWeek(cursor).toISOString();
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

      if (dayAtCapacity || weekAtCapacity) {
        continue;
      }

      const blocks = blockedByDate.get(isoDate) ?? [];
      const openSlots = subtractBlocksFromSlots(dayAvailability, blocks);

      const filtered = openSlots.filter((slot) => {
        const slotKey = `${dayKey}|${normalizeSlotToString(slot)}`;
        const currentCount = slotCounts.get(slotKey) ?? 0;
        return currentCount < slotCapacity;
      });

      if (filtered.length) {
        availableSlots.push({
          date: isoDate,
          slots: filtered,
        });
      }
    }

    return res.json({ bookings, blockedTimes, availableSlots });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to load calendar data" });
  }
};
