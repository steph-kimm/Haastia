import Availability from "../models/availability.js";

// Create or update availability for a professional
export const setAvailability = async (req, res) => {
  try {
    const { professionalId, day, slots } = req.body;

    // Replace existing entry for that day, or create one if not found
    const updated = await Availability.findOneAndUpdate(
      { professionalId, day },
      { slots },
      { new: true, upsert: true } // create if doesn't exist
    );

    res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to set availability" });
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
