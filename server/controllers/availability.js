import Availability from "../models/availability.js";

// Create or update availability for a professional
export const setAvailability = async (req, res) => {
  console.log('found me')
  try {
    const { professionalId } = req.params;
    const { availability } = req.body;

    const updated = await Availability.findOneAndUpdate(
      { professionalId },
      { availability },
      { upsert: true, new: true }
    );

    res.json(updated);
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
