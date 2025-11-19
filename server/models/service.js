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
    deposit: {
      type: Number,
      min: 0,
      default: 0,
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
    allowFreeReservations: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

serviceSchema.pre("validate", function (next) {
  if (this.deposit == null || this.price == null) {
    return next();
  }

  if (this.deposit > this.price) {
    this.invalidate("deposit", "Deposit cannot exceed price", this.deposit);
  }

  next();
});

serviceSchema.pre("findOneAndUpdate", async function (next) {
  try {
    const update = this.getUpdate() || {};
    const updateDoc = update.$set ? update.$set : update;

    if (updateDoc.deposit === undefined && updateDoc.price === undefined) {
      return next();
    }

    const current = await this.model.findOne(this.getQuery()).select("price deposit");
    if (!current) {
      return next();
    }

    const nextPrice =
      updateDoc.price !== undefined ? updateDoc.price : current.price;
    const nextDeposit =
      updateDoc.deposit !== undefined ? updateDoc.deposit : current.deposit;

    if (nextDeposit != null && nextPrice != null && nextDeposit > nextPrice) {
      const error = new mongoose.Error.ValidationError();
      error.addError(
        "deposit",
        new mongoose.Error.ValidatorError({
          message: "Deposit cannot exceed price",
          path: "deposit",
          value: nextDeposit,
        })
      );
      return next(error);
    }

    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model("Service", serviceSchema);
