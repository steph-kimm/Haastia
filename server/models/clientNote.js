import mongoose from "mongoose";

const { Schema } = mongoose;

const clientNoteSchema = new Schema(
  {
    professional: { type: Schema.Types.ObjectId, ref: "User", required: true },
    customer: { type: Schema.Types.ObjectId, ref: "User" },
    guestKey: { type: String, trim: true, index: true },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

clientNoteSchema.index({ professional: 1, customer: 1, createdAt: 1 });
clientNoteSchema.index({ professional: 1, guestKey: 1, createdAt: 1 });

clientNoteSchema.pre("validate", function handleCustomerOrGuest(next) {
  if (!this.customer && !this.guestKey) {
    next(new Error("Client notes must reference a customer or guest key."));
    return;
  }

  next();
});

export default mongoose.model("ClientNote", clientNoteSchema);
