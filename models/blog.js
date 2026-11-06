const mongoose = require("mongoose");
const { Schema } = mongoose;

const blogSchema = new Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  excerpt: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, default: "Travel Guide" },
  tags: [String],
  image: {
    url: String,
    filename: String,
  },
  author: { type: String, default: "Asteria Editorial" },
  readTime: { type: String, default: "5 min read" },
  seoTitle: String,
  seoDescription: String,
  relatedPackages: [{ type: Schema.Types.ObjectId, ref: "TravelPackage" }],
  status: { type: String, enum: ["draft", "published"], default: "published" },
  publishedAt: { type: Date, default: Date.now },
}, { timestamps: true });

blogSchema.index({ title: "text", content: "text", category: "text" });

module.exports = mongoose.model("Blog", blogSchema);

