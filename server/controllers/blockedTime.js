import BlockedTime from "../models/blockedTime.js";

const parseTimeToMinutes = (value) => {
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

const normalizeDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const ensureAccess = (req, professionalId) => {
  const requesterId = req.user?._id ? String(req.user._id) : null;
  const requesterRole = req.user?.role;
  const targetId = String(professionalId);

  if (!requesterId) {
    return false;
  }

  if (requesterRole === "admin") {
    return true;
  }

  return requesterId === targetId;
};

export const listBlockedTimes = async (req, res) => {
  try {
    const { professionalId } = req.params;
    const { start, end } = req.query || {};

    if (!professionalId) {
      return res.status(400).json({ error: "Missing professionalId" });
    }

    const normalizedStart = start ? normalizeDate(start) : null;
    const normalizedEnd = end ? normalizeDate(end) : null;

    if (start && !normalizedStart) {
      return res.status(400).json({ error: "Invalid start date" });
    }

    if (end && !normalizedEnd) {
      return res.status(400).json({ error: "Invalid end date" });
    }

    const query = { professionalId };

    if (normalizedStart || normalizedEnd) {
      query.date = {};
      if (normalizedStart) {
        query.date.$gte = normalizedStart;
      }
      if (normalizedEnd) {
        const exclusiveEnd = new Date(normalizedEnd);
        exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
        query.date.$lt = exclusiveEnd;
      }
    }

    const blockedTimes = await BlockedTime.find(query)
      .sort({ date: 1, start: 1 })
      .lean();

    res.json(blockedTimes);
  } catch (err) {
    console.error("Error listing blocked times:", err);
    res.status(500).json({ error: "Failed to list blocked times" });
  }
};

export const createBlockedTime = async (req, res) => {
  try {
    const { professionalId } = req.params;
    const { date, start, end, reason } = req.body || {};

    if (!professionalId) {
      return res.status(400).json({ error: "Missing professionalId" });
    }

    if (!ensureAccess(req, professionalId)) {
      return res.status(403).json({ error: "Not authorized to create blocked time" });
    }

    const normalizedDate = normalizeDate(date);
    const startMinutes = parseTimeToMinutes(start);
    const endMinutes = parseTimeToMinutes(end);

    if (!normalizedDate) {
      return res.status(400).json({ error: "Invalid or missing date" });
    }

    if (startMinutes === null || endMinutes === null) {
      return res.status(400).json({ error: "Invalid start or end time" });
    }

    if (startMinutes >= endMinutes) {
      return res.status(400).json({ error: "Start time must be before end time" });
    }

    const existingBlocks = await BlockedTime.find({
      professionalId,
      date: normalizedDate,
    });

    const overlaps = existingBlocks.some((block) => {
      const blockStart = parseTimeToMinutes(block.start);
      const blockEnd = parseTimeToMinutes(block.end);
      if (blockStart === null || blockEnd === null) return false;

      return startMinutes < blockEnd && endMinutes > blockStart;
    });

    if (overlaps) {
      return res.status(409).json({ error: "Blocked time overlaps with an existing block" });
    }

    const blockedTime = await BlockedTime.create({
      professionalId,
      date: normalizedDate,
      start,
      end,
      reason,
      createdBy: req.user._id,
    });

    res.status(201).json(blockedTime);
  } catch (err) {
    console.error("Error creating blocked time:", err);
    res.status(500).json({ error: "Failed to create blocked time" });
  }
};

export const deleteBlockedTime = async (req, res) => {
  try {
    const { id } = req.params;

    const blockedTime = await BlockedTime.findById(id);
    if (!blockedTime) {
      return res.status(404).json({ error: "Blocked time not found" });
    }

    if (!ensureAccess(req, blockedTime.professionalId)) {
      return res.status(403).json({ error: "Not authorized to delete this blocked time" });
    }

    await blockedTime.deleteOne();

    res.status(204).send();
  } catch (err) {
    console.error("Error deleting blocked time:", err);
    res.status(500).json({ error: "Failed to delete blocked time" });
  }
};
