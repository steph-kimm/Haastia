import Availability from "../models/availability.js";

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
