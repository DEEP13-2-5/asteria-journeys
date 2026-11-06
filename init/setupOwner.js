// Secure one-time bootstrap: npm run setup:owner -- <existing-username>
// It never creates a user or hardcodes credentials, and refuses if an owner already exists.
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/user");
const TravelPackage = require("../models/package");
const Listing = require("../models/listing");
const username = process.argv[2];
const uri = process.env.ATLASTDB_URL || process.env.MONGODB_URI || process.env.MONGO_URL;
(async () => {
  if (!username) throw new Error("Provide the existing username.");
  await mongoose.connect(uri);
  if (await User.exists({ role: "owner", active: true })) throw new Error("An active owner already exists; bootstrap is locked.");
  const owner = await User.findOne({ username });
  if (!owner) throw new Error("Existing user not found.");
  owner.role = "owner"; owner.active = true; await owner.save();
  await TravelPackage.updateMany({ createdBy: null }, { $set: { createdBy: owner._id } });
  await Listing.updateMany({ $or: [{ owner: null }, { owner: { $exists: false } }] }, { $set: { owner: owner._id } });
  console.log(`Promoted ${owner.username} and assigned unowned travel packages.`);
  await mongoose.disconnect();
})().catch(async error => { console.error(error.message); try { await mongoose.disconnect(); } catch (_) {} process.exitCode = 1; });
