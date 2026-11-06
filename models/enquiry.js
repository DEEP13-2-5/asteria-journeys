const mongoose = require("mongoose");
const { Schema } = mongoose;

const messageSchema = new Schema({
  direction: { type: String, enum: ["inbound", "outbound", "system"], required: true },
  text: String,
  createdAt: { type: Date, default: Date.now },
  author: String,
}, { _id: false });

const enquirySchema = new Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  source: { type: String, default: "Website form" },
  package: { type: Schema.Types.ObjectId, ref: "TravelPackage" },
  customer: { type: Schema.Types.ObjectId, ref: "User", default: null },
  message: { type: String, required: true },
  travelDates: String,
  travellers: String,
  fareType: { type: String, default: "Regular" },
  promoCode: String,
  customPackage: { type: Schema.Types.Mixed, default: null },
  quote: { type: Schema.Types.ObjectId, ref: "Quote", default: null },
  whatsappConsent: { type: Boolean, default: false },
  status: { type: String, enum: ["new", "in_progress", "quoted", "closed"], default: "new" },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null },
  notes: String,
  ai: {
    dates: String,
    travellers: String,
    destination: String,
    budget: String,
    mustHave: String,
    suggestions: [{ type: Schema.Types.ObjectId, ref: "TravelPackage" }],
    personalizedPlan: String,
    draftReply: String,
    acceptedAt: Date,
  },
  messages: [messageSchema],
}, { timestamps: true });

module.exports = mongoose.model("Enquiry", enquirySchema);
