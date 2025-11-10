import mongoose from "mongoose";

const { Schema } = mongoose;

const clientNoteSchema = new Schema(
  {
    professional: { type: Schema.Types.ObjectId, ref: "User", required: true },
    customer: { type: Schema.Types.ObjectId, ref: "User" },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

clientNoteSchema.index({ professional: 1, customer: 1, createdAt: 1 });

export default mongoose.model("ClientNote", clientNoteSchema);
