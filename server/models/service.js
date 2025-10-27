import mongoose from "mongoose";
const { Schema } = mongoose;

// Subschemas
const imageSchema = new Schema({
  public_id: String,
  url: String,
});

const addOnSchema = new Schema({
  title: {
    type: String,
    trim: true,
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
});

// Main schema
const serviceSchema = new Schema(
  {
    professional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      trim: true,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      default: "Other",
    },
    images: [imageSchema],
    addOns: [addOnSchema],
    duration: {
      type: Number, // in minutes
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Service", serviceSchema);
