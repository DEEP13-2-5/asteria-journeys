const mongoose = require("mongoose");
const { Schema } = mongoose;

const hotelSchema = new Schema({
  name: { type: String, required: true },
  location: { type: String, required: true, index: true },
  starCategory: { type: String, default: "4 star" },
  pricePerNight: { type: Number, required: true },
  rating: { type: Number, default: 4.8 },
  reviewsCount: { type: Number, default: 120 },
  image: String,
  amenities: [String],
  description: String,
  coordinates: { type: [Number], default: [76.2673, 9.9312] },
  isFeatured: { type: Boolean, default: true },
}, { timestamps: true });

hotelSchema.index({ name: "text", location: "text", starCategory: "text" });

module.exports = mongoose.model("Hotel", hotelSchema);

