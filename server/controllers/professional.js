import User from "../models/user.js";
import Availability from "../models/availability.js";

export const getProfessionalProfile = async (req, res) => {
  try {
    const { id } = req.params; // professionalId
    console.log("looking, " ,id)
    // 1️⃣ Find the user and ensure they’re a professional
    const professional = await User.findById(id).select("-password");
    if (!professional) {
      return res.status(404).json({ error: "Professional not found" });
    }
    if (professional.role !== "professional") {
      return res.status(400).json({ error: "User is not a professional" });
    }

    // 2️⃣ Fetch availability for this professional
    const availability = await Availability.find({ professionalId: id }).sort({ day: 1 });

    // 3️⃣ Combine and return
    return res.json({
      professional,
      availability,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
};