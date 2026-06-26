import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    destination: {
      type: String,
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    budget: {
      type: Number,
      default: 0,
    },

    travelers: {
      type: Number,
      default: 1,
    },

    tripType: {
      type: String,
      enum: ["Solo", "Family", "Friends", "Business", "Couple"],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Trip", tripSchema);