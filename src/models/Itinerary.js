const mongoose = require("mongoose");
const crypto = require("crypto");

const itinerarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    extractedText: String,
    itinerary: String,
    shareId: {
      type: String,
      default: () => crypto.randomUUID(),
      unique: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Itinerary", itinerarySchema);