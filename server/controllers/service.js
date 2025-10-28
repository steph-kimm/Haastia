import Service from "../models/service.js";
import cloudinary from "cloudinary";
import { nanoid } from "nanoid";


export const addService = async (req, res) => {
  try {
    let imageArray = [];

    // Upload images to Cloudinary
    if (req.body.images?.length > 0) {
      for (const img of req.body.images) {
        const result = await cloudinary.uploader.upload(img, {
          public_id: nanoid(),
          resource_type: "image",
        });
        imageArray.push({
          public_id: result.public_id,
          url: result.secure_url,
        });
      }
    }

    const service = await new Service({
      ...req.body,
      images: imageArray,
      professional: req.user._id, // ✅ from middleware
    }).save();

    res.json(service);
  } catch (err) {
    console.error("Error adding service:", err);
    res.status(500).json({ error: "Error adding service" });
  }
};

// Get all services of the logged-in professional
export const getMyServices = async (req, res) => {
  try {
    const services = await Service.find({ professional: req.user._id })
      .sort({ createdAt: -1 })
      .populate("professional", "name location image rating jobs_done");

    res.json(services);
  } catch (err) {
    console.error("Error fetching my services:", err);
    res.status(500).json({ error: "Error fetching services" });
  }
};

// Get all services of a specific professional (by userId — for customers)
export const getProfessionalServices = async (req, res) => {
  try {
    const services = await Service.find({ professional: req.params.userId })
      .sort({ createdAt: -1 })
      .populate("professional", "name location image rating jobs_done");

    if (!services || services.length === 0) {
      return res.status(404).json({ message: "No services found for this professional" });
    }
    console.log('services,' , services)
    res.json(services);
  } catch (err) {
    console.error("Error fetching professional's services:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update a service (only if owned by logged-in pro)
export const updateService = async (req, res) => {
  try {
    const updated = await Service.findOneAndUpdate(
      { _id: req.params.id, professional: req.user._id },
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Service not found or unauthorized" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Error updating service:", err);
    res.status(500).json({ error: "Error updating service" });
  }
};

// Delete a service (only if owned by logged-in pro)
export const deleteService = async (req, res) => {
  try {
    const deleted = await Service.findOneAndDelete({
      _id: req.params.id,
      professional: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Service not found or unauthorized" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting service:", err);
    res.status(500).json({ error: "Error deleting service" });
  }
};
