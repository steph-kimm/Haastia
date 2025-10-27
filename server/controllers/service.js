import Service from "../models/service.js";
import cloudinary from "cloudinary";
import { nanoid } from "nanoid";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

// Add a new service (formerly addPost)
export const addService = async (req, res) => {
  try {
    let imageArray = [];

    // Upload each image to Cloudinary
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

    // Create the service (replace "owner" with "professional")
    const service = await new Service({
      ...req.body,
      images: imageArray,
      professional: req.user._id, // ✅ from token middleware
    }).save();

    res.json(service);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error adding service" });
  }
};

// Get all services
export const getServices = async (req, res) => {
  try {
    const all = await Service.find()
      .populate("professional", "name location image rating jobs_done")
      .sort({ createdAt: -1 })
      .limit(500);

    res.json(all);
  } catch (err) {
    console.error("Error fetching services:", err);
    res.status(500).json({ error: "Failed to fetch services" });
  }
};

// Get a single service by ID
export const getServiceById = async (req, res) => {
  const { id } = req.params;
  try {
    const service = await Service.findById(id).populate(
      "professional",
      "name location image rating jobs_done"
    );
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.json(service);
  } catch (err) {
    console.error("Error fetching service:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all services for a specific professional
export const getProfessionalServices = async (req, res) => {
  try {
    const services = await Service.find({ professional: req.params.userId })
      .sort({ createdAt: -1 })
      .populate("professional", "name location image rating jobs_done");

    if (!services || services.length === 0) {
      return res.status(404).json({ message: "No services found for this professional" });
    }

    res.json(services);
  } catch (error) {
    console.error("Error fetching professional's services:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
