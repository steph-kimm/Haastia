import Availability from "../models/availability.js";
import Booking from "../models/booking.js";
import {
  INACTIVE_BOOKING_STATUSES,
  getEffectiveMaxBookingsPerSlot,
  getProfessionalSchedulingLimits,
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
  target.setUTCDate(target.getUTCDate() + diff);
  return target;
};

// Create or update availability for a professional
export const setAvailability = async (req, res) => {
  try {
    const { professionalId } = req.params;
    const { availability } = req.body;

    if (!professionalId) {
      return res.status(400).json({ error: "Missing professionalId" });
    }

    const entries = Array.isArray(availability) ? availability : [];

    const availabilityByDay = new Map();

    entries.forEach((entry) => {
      if (!entry || typeof entry !== "object") return;

      const { day, slots } = entry;
      if (!day) return;

      const normalizedSlots = Array.isArray(slots)
        ? slots
            .map((slot) => {
              if (!slot) return null;
              if (typeof slot === "string") {
                const [start, end] = slot.split("-");
                if (start && end) {
                  return { start, end };
                }
                return null;
              }

              const { start, end } = slot;
              if (start && end) {
                return { start, end };
              }
              return null;
            })
            .filter(Boolean)
        : [];

      availabilityByDay.set(day, {
        professionalId,
        day,
        slots: normalizedSlots,
      });
    });

    await Availability.deleteMany({ professionalId });

    const documents = Array.from(availabilityByDay.values());

    if (documents.length) {
      await Availability.bulkWrite(
        documents.map((doc) => ({
          updateOne: {
            filter: { professionalId: doc.professionalId, day: doc.day },
            update: { $set: doc },
            upsert: true,
          },
        }))
      );
    }

    const savedAvailability = await Availability.find({ professionalId }).sort({ day: 1 });

    res.status(200).json(savedAvailability);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update availability" });
  }
};


// Get all availability for a professional
export const getAvailability = async (req, res) => {
  try {
    const { professionalId } = req.params;
    const availability = await Availability.find({ professionalId });
    res.status(200).json(availability);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get availability" });
  }
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

// Return available slots for a professional excluding accepted bookings and respecting limits
export const getAvailableSlotsForProfessional = async (req, res) => {
  try {
    const { id } = req.params;

    const schedulingLimits = await getProfessionalSchedulingLimits(id);
    if (!schedulingLimits) {
      return res.status(404).json({ error: "Professional not found" });
    }

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

    const { slotCounts, dayCounts, weekCounts } = buildBookingCountMaps(activeBookings);
    const slotCapacity = getEffectiveMaxBookingsPerSlot(schedulingLimits);

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
