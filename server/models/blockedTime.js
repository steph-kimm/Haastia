import mongoose from "mongoose";

const { Schema } = mongoose;

const blockedTimeSchema = new Schema(
  {
    professionalId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    start: {
      type: String,
      required: true,
    },
    end: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      default: "",
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

blockedTimeSchema.index({ professionalId: 1 });
blockedTimeSchema.index({ professionalId: 1, date: 1 });

export default mongoose.model("BlockedTime", blockedTimeSchema);
