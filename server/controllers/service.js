import Service from "../models/service.js";
import cloudinary from "cloudinary";
import { nanoid } from "nanoid";

const numericFields = ["price", "deposit", "duration"];

const coerceNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return { value: undefined };
  }

  const num = Number(value);
  if (!Number.isFinite(num)) {
    return { error: "must be a number" };
  }

  return { value: num };
};

const sanitizeAddOns = (input, errors) => {
  if (input === undefined) return undefined;
  if (!Array.isArray(input)) {
    errors.push("addOns must be an array");
    return undefined;
  }

  return input.map((addOn) => {
    if (!addOn || typeof addOn !== "object") {
      errors.push("addOn entries must be objects");
      return {};
    }

    const sanitized = {};
    if (addOn.title !== undefined) sanitized.title = addOn.title;
    if (addOn.description !== undefined) sanitized.description = addOn.description;

    if (addOn.price !== undefined) {
      const coerced = coerceNumber(addOn.price);
      if (coerced.error) {
        errors.push("addOn price must be a number");
      } else if (coerced.value !== undefined) {
        sanitized.price = coerced.value;
      }
    }

    return sanitized;
  });
};

const extractServicePayload = (body) => {
  const errors = [];
  const data = {};

  const allowed = [
    "title",
    "description",
    "category",
    "addOns",
    "price",
    "deposit",
    "duration",
  ];

  for (const field of allowed) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }

  if (Object.prototype.hasOwnProperty.call(data, "addOns")) {
    const sanitizedAddOns = sanitizeAddOns(data.addOns, errors);
    if (sanitizedAddOns !== undefined) {
      data.addOns = sanitizedAddOns;
    } else {
      delete data.addOns;
    }
  }

  for (const field of numericFields) {
    if (data[field] === undefined) continue;
    const coerced = coerceNumber(data[field]);
    if (coerced.error) {
      errors.push(`${field} ${coerced.error}`);
      delete data[field];
    } else if (coerced.value !== undefined) {
      data[field] = coerced.value;
    } else {
      delete data[field];
    }
  }

  return { data, errors };
};

const respondValidationError = (res, error) => {
  if (Array.isArray(error)) {
    return res.status(400).json({ error: error[0], errors: error });
  }

  if (error?.name === "ValidationError") {
    const messages = Object.values(error.errors || {}).map((err) => err.message);
    const message = messages[0] || "Validation failed";
    return res.status(400).json({ error: message, errors: messages });
  }

  return null;
};

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

    const { data, errors } = extractServicePayload(req.body);

    if (data.price !== undefined && data.deposit !== undefined && data.deposit > data.price) {
      errors.push("deposit cannot be greater than price");
    }

    if (errors.length) {
      return respondValidationError(res, errors);
    }

    const service = await new Service({
      ...data,
      images: imageArray,
      professional: req.user._id, // ✅ from middleware
    }).save();

    res.json(service);
  } catch (err) {
    console.error("Error adding service:", err);
    const handled = respondValidationError(res, err);
    if (!handled) {
      res.status(500).json({ error: "Error adding service" });
    }
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
    const { data, errors } = extractServicePayload(req.body);

    if (errors.length) {
      return respondValidationError(res, errors);
    }

    const service = await Service.findOne({
      _id: req.params.id,
      professional: req.user._id,
    });

    if (!service) {
      return res.status(404).json({ error: "Service not found or unauthorized" });
    }

    const nextPrice = data.price !== undefined ? data.price : service.price;
    const nextDeposit = data.deposit !== undefined ? data.deposit : service.deposit;

    if (nextDeposit != null && nextPrice != null && nextDeposit > nextPrice) {
      return res
        .status(400)
        .json({ error: "deposit cannot be greater than price", errors: ["deposit cannot be greater than price"] });
    }

    Object.assign(service, data);

    const updated = await service.save();

    res.json(updated);
  } catch (err) {
    console.error("Error updating service:", err);
    const handled = respondValidationError(res, err);
    if (!handled) {
      res.status(500).json({ error: "Error updating service" });
    }
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
