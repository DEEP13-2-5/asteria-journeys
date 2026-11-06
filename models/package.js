const mongoose = require("mongoose");
const { Schema } = mongoose;

const priceSchema = new Schema({
  label: { type: String, required: true },
  startDate: Date,
  endDate: Date,
  price: { type: Number, required: true, min: 0 },
  gstNote: { type: String, default: "GST additional" },
}, { _id: false });

const itinerarySchema = new Schema({
  day: Number,
  title: String,
  description: String,
}, { _id: false });

const versionSchema = new Schema({
  version: Number,
  savedAt: { type: Date, default: Date.now },
  savedBy: String,
  note: String,
  snapshot: Schema.Types.Mixed,
}, { _id: false });

const packageSchema = new Schema({
  code: { type: String, required: true, unique: true, trim: true },
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  subtitle: String,
  description: String,
  days: { type: Number, required: true, min: 1 },
  nights: { type: Number, min: 0 },
  hotelCategory: { type: String, default: "4 star" },
  image: { url: String, filename: String },
  gallery: [{ url: String, filename: String }],
  destinations: [String],
  itinerary: [itinerarySchema],
  inclusions: [String],
  seasonalPrices: [priceSchema],
  status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  coordinates: { type: [Number], default: [76.2673, 9.9312] },
  versions: [versionSchema],
  updatedBy: String,
}, { timestamps: true });

packageSchema.index({ title: "text", destinations: "text", description: "text" });
module.exports = mongoose.model("TravelPackage", packageSchema);
