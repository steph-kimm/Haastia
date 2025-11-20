import Booking from "../models/booking.js";
import BlockedTime from "../models/blockedTime.js";
import User, { DEFAULT_SCHEDULING_LIMITS } from "../models/user.js";

export const INACTIVE_BOOKING_STATUSES = ["cancelled", "declined"];

export const applySchedulingLimitDefaults = (limits = {}) => ({
  ...DEFAULT_SCHEDULING_LIMITS,
  ...(limits?.toObject?.() ?? limits),
});

export const getEffectiveMaxBookingsPerSlot = (limits) => {
  const value = limits?.maxBookingsPerSlot;
  const numericValue = Number(value);
  if (Number.isFinite(numericValue) && numericValue > 0) {
    return numericValue;
  }
  return 1;
};

export const getProfessionalSchedulingLimits = async (professionalId) => {
  const professional = await User.findById(professionalId).select("schedulingLimits");
  if (!professional) return null;
  return applySchedulingLimitDefaults(professional.schedulingLimits || {});
};

export const startOfUtcDay = (date) => {
  const dayStart = new Date(date);
  dayStart.setUTCHours(0, 0, 0, 0);
  return dayStart;
};

export const startOfUtcWeek = (date) => {
  const weekStart = startOfUtcDay(date);
  const dayOfWeek = weekStart.getUTCDay();
  weekStart.setUTCDate(weekStart.getUTCDate() - dayOfWeek);
  return weekStart;
};

const parseTimeToMinutes = (value) => {
  if (typeof value !== "string") return null;
  const [hoursStr, minutesStr] = value.split(":");
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
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

const toMinutesRange = (slot) => {
  if (!slot) return null;
  const isString = typeof slot === "string";
  const [rawStart, rawEnd] = isString ? slot.split("-") : [slot?.start, slot?.end];
  const start = typeof rawStart === "string" ? rawStart.trim() : "";
  const end = typeof rawEnd === "string" ? rawEnd.trim() : "";
  if (!start || !end) return null;
  const startMinutes = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);
  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return null;
  }
  return { startMinutes, endMinutes };
};

export const normalizeTimeSlot = (slot) => {
  if (!slot) return null;
  const start = typeof slot.start === "string" ? slot.start.trim() : "";
  const end = typeof slot.end === "string" ? slot.end.trim() : "";
  if (!start || !end) return null;
  const range = toMinutesRange({ start, end });
  if (!range) return null;
  return { start, end };
};

export const normalizeDateOnly = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

export const slotsOverlap = (slotA, slotB) => {
  const rangeA = toMinutesRange(slotA);
  const rangeB = toMinutesRange(slotB);
  if (!rangeA || !rangeB) return false;
  return rangeA.startMinutes < rangeB.endMinutes && rangeA.endMinutes > rangeB.startMinutes;
};

export const findSlotConflicts = async ({
  professionalId,
  date,
  timeSlot,
  excludeBookingId,
  maxBookingsPerSlot,
}) => {
  const dayStart = startOfUtcDay(date);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const bookingQuery = {
    professional: professionalId,
    status: { $nin: INACTIVE_BOOKING_STATUSES },
    date: { $gte: dayStart, $lt: dayEnd },
  };

  if (excludeBookingId) {
    bookingQuery._id = { $ne: excludeBookingId };
  }

  const [bookings, blockedTimes] = await Promise.all([
    Booking.find(bookingQuery).select("timeSlot").lean(),
    BlockedTime.find({ professionalId, date: dayStart }).select("start end").lean(),
  ]);

  const overlappingBookings = bookings.filter((existing) =>
    slotsOverlap(existing.timeSlot, timeSlot),
  );

  const capacityLimit = maxBookingsPerSlot ?? 1;
  if (capacityLimit > 0 && overlappingBookings.length >= capacityLimit) {
    return {
      type: "booking",
      bookingId: overlappingBookings[0]?._id,
      count: overlappingBookings.length,
      capacity: capacityLimit,
    };
  }

  const conflictingBlockedTime = blockedTimes.find((block) =>
    slotsOverlap({ start: block.start, end: block.end }, timeSlot),
  );
  if (conflictingBlockedTime) {
    return { type: "blockedTime", blockId: conflictingBlockedTime._id };
  }

  return null;
};

export const countBookingsForRanges = async ({
  professionalId,
  dayStart,
  weekStart,
  excludeBookingId,
}) => {
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

  const baseQuery = {
    professional: professionalId,
    status: { $nin: INACTIVE_BOOKING_STATUSES },
  };

  const dayQuery = {
    ...baseQuery,
    date: { $gte: dayStart, $lt: dayEnd },
  };

  const weekQuery = {
    ...baseQuery,
    date: { $gte: weekStart, $lt: weekEnd },
  };

  if (excludeBookingId) {
    dayQuery._id = { $ne: excludeBookingId };
    weekQuery._id = { $ne: excludeBookingId };
  }

  const [dayCount, weekCount] = await Promise.all([
    Booking.countDocuments(dayQuery),
    Booking.countDocuments(weekQuery),
  ]);

  return { dayCount, weekCount };
};
