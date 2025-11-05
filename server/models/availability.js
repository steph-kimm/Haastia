import mongoose from "mongoose";
const { Schema } = mongoose;

const slotSchema = new Schema({
  start: { type: String, required: true }, // e.g. "09:00"
  end: { type: String, required: true },   // e.g. "11:00"
});

const availabilitySchema = new Schema(
  {
    professionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    day: {
      type: String, // "Monday", "Tuesday", etc.
      required: true,
    },
    slots: [slotSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Availability", availabilitySchema);
