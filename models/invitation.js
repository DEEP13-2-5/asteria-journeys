const mongoose = require("mongoose");
const { Schema } = mongoose;
const invitationSchema = new Schema({
  recipientName: { type: String, required: true, trim: true },
  tokenHash: { type: String, required: true, unique: true },
  role: { type: String, enum: ["consultant"], default: "consultant" },
  invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  acceptedAt: Date,
}, { timestamps: true });
module.exports = mongoose.model("Invitation", invitationSchema);
