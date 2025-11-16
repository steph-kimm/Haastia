import Booking from "../models/booking.js";
import BlockedTime from "../models/blockedTime.js";

export const INACTIVE_BOOKING_STATUSES = ["cancelled", "declined"];

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
}) => {
  const dayStart = new Date(date);
  dayStart.setUTCHours(0, 0, 0, 0);
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

  const conflictingBooking = bookings.find((existing) =>
    slotsOverlap(existing.timeSlot, timeSlot),
  );
  if (conflictingBooking) {
    return { type: "booking", bookingId: conflictingBooking._id };
  }

  const conflictingBlockedTime = blockedTimes.find((block) =>
    slotsOverlap({ start: block.start, end: block.end }, timeSlot),
  );
  if (conflictingBlockedTime) {
    return { type: "blockedTime", blockId: conflictingBlockedTime._id };
  }

  return null;
};
