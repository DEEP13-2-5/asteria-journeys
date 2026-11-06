const mongoose = require("mongoose");
const { Schema } = mongoose;

const placeSchema = new Schema({
  name: { type: String, required: true },
  location: { type: String, required: true, index: true },
  category: { type: String, default: "Attraction" },
  bestTimeToVisit: { type: String, default: "Morning / Sunset" },
  duration: { type: String, default: "2-3 hours" },
  image: String,
  description: String,
  highlights: [String],
}, { timestamps: true });

placeSchema.index({ name: "text", location: "text", category: "text" });

module.exports = mongoose.model("Place", placeSchema);

