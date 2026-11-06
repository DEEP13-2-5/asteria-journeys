const mongoose = require("mongoose");
const { Schema } = mongoose;

const quoteSchema = new Schema({
  quoteNumber: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: String,
  packageTitle: { type: String, required: true },
  packageCode: String,
  packageRef: { type: Schema.Types.ObjectId, ref: "TravelPackage" },
  enquiryRef: { type: Schema.Types.ObjectId, ref: "Enquiry" },
  destinations: [String],
  days: { type: Number, required: true },
  nights: { type: Number, required: true },
  travellers: { type: String, default: "2 Adults" },
  travelDates: String,
  hotelCategory: { type: String, default: "4 star" },
  hotels: [String],
  itinerary: [{ day: Number, title: String, description: String }],
  inclusions: [String],
  basePricePerPerson: { type: Number, required: true },
  fareType: { type: String, default: "Regular" },
  specialDiscount: { type: Number, default: 0 },
  promoCode: String,
  promoDiscount: { type: Number, default: 0 },
  subtotal: { type: Number, required: true },
  gstPercent: { type: Number, default: 5 },
  gstAmount: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  notes: String,
  status: { type: String, enum: ["draft", "sent", "accepted", "expired"], default: "sent" },
  validUntil: { type: Date, default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.model("Quote", quoteSchema);

