const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DAY_INDEX = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const padTimePart = (value) => value.toString().padStart(2, "0");

export const toISODateString = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return [date.getFullYear(), padTimePart(date.getMonth() + 1), padTimePart(date.getDate())].join("-");
};

export const normalizeSlot = (slot) => {
  if (!slot) return null;
  if (typeof slot === "string") {
    const [start, end] = slot.split("-");
    if (start && end) {
      return { start: start.trim(), end: end.trim() };
    }
    return null;
  }
  const start = slot.start?.trim?.() ?? slot.start;
  const end = slot.end?.trim?.() ?? slot.end;
  if (typeof start === "string" && typeof end === "string") {
    return { start, end };
  }
  return null;
};

export const getDayAvailabilityForDate = (availability, isoDate) => {
  if (!isoDate) return null;
  const day = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(day.getTime())) return null;
  const dayName = DAY_NAMES[day.getDay()];
  return availability?.find((entry) => entry.day?.toLowerCase?.() === dayName.toLowerCase());
};

export const timeStringToMinutes = (value) => {
  if (typeof value !== "string") return null;
  const [hours, minutes] = value.split(":").map(Number);
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

export const minutesToTimeString = (minutes) => {
  if (!Number.isFinite(minutes)) return null;
  const clamped = Math.max(0, Math.min(minutes, 24 * 60));
  const hours = Math.floor(clamped / 60);
  const mins = Math.round(clamped % 60);
  return `${padTimePart(hours)}:${padTimePart(mins)}`;
};

export const groupBlockedTimesByDate = (blockedTimes = []) => {
  const map = new Map();
  blockedTimes.forEach((block) => {
    const iso = toISODateString(block.date);
    if (!iso) return;
    const normalized = normalizeSlot(block);
    if (!normalized) return;
    const entry = { ...block, ...normalized, isoDate: iso };
    if (!map.has(iso)) {
      map.set(iso, [entry]);
    } else {
      map.get(iso).push(entry);
    }
  });
  for (const [, list] of map) {
    list.sort((a, b) => timeStringToMinutes(a.start) - timeStringToMinutes(b.start));
  }
  return map;
};

export const combineDateAndTime = (isoDate, time) => {
  if (!isoDate || !time) return null;
  const normalizedDate = toISODateString(isoDate);
  if (!normalizedDate) return null;
  const [hours, minutes] = time.split(":");
  if (hours === undefined || minutes === undefined) return null;
  return `${normalizedDate}T${padTimePart(hours)}:${padTimePart(minutes)}:00`;
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
    .map(normalizeSlot)
    .filter(Boolean)
    .map(({ start, end }) => ({
      start: timeStringToMinutes(start),
      end: timeStringToMinutes(end),
    }))
    .filter((interval) => interval.start !== null && interval.end !== null && interval.end > interval.start);

const normalizeBlocksToIntervals = (blocks = []) =>
  blocks
    .map((block) => {
      const normalized = normalizeSlot(block);
      if (!normalized) return null;
      return {
        start: timeStringToMinutes(normalized.start),
        end: timeStringToMinutes(normalized.end),
      };
    })
    .filter((interval) => interval && interval.start !== null && interval.end !== null && interval.end > interval.start);

export const subtractBlocksFromSlots = (slots = [], blocks = []) => {
  const intervals = toIntervals(slots);
  const blockIntervals = normalizeBlocksToIntervals(blocks);
  const reduced = blockIntervals.reduce(
    (current, block) => current.flatMap((interval) => subtractInterval(interval, block)),
    intervals
  );
  return reduced.map((interval) => ({
    start: minutesToTimeString(interval.start),
    end: minutesToTimeString(interval.end),
  }));
};

const overlaps = (slot, block) => {
  const slotInterval = normalizeBlocksToIntervals([slot])[0];
  const blockInterval = normalizeBlocksToIntervals([block])[0];
  if (!slotInterval || !blockInterval) return false;
  return slotInterval.start < blockInterval.end && blockInterval.start < slotInterval.end;
};

export const filterSlotsAgainstBlocks = (slots = [], blocks = []) => {
  const normalizedBlocks = blocks.map(normalizeSlot).filter(Boolean);
  return slots
    .map(normalizeSlot)
    .filter(Boolean)
    .filter((slot) => !normalizedBlocks.some((block) => overlaps(slot, block)));
};

export const buildBusinessHoursWithBlockedTimes = (
  availability = [],
  blockedTimes = [],
  { lookAheadDays = 180, lookBackDays = 30 } = {}
) => {
  const weeklyMap = new Map();
  availability.forEach((entry) => {
    const dow = DAY_INDEX[entry.day];
    if (dow === undefined) return;
    const slots = entry.slots?.map(normalizeSlot).filter(Boolean) ?? [];
    if (!slots.length) return;
    weeklyMap.set(dow, slots);
  });

  if (!weeklyMap.size) return [];

  const blockedByDate = groupBlockedTimesByDate(blockedTimes);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const windows = [];

  for (let offset = -lookBackDays; offset <= lookAheadDays; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const isoDate = toISODateString(date);
    const daySlots = weeklyMap.get(date.getDay());
    if (!isoDate || !daySlots?.length) continue;
    const blocksForDate = blockedByDate.get(isoDate) ?? [];
    const available = subtractBlocksFromSlots(daySlots, blocksForDate);
    available.forEach((slot) => {
      const start = combineDateAndTime(isoDate, slot.start);
      const end = combineDateAndTime(isoDate, slot.end);
      if (start && end) {
        windows.push({ start, end });
      }
    });
  }

  return windows;
};

export { DAY_NAMES, DAY_INDEX };
