const test = require("node:test");
const assert = require("node:assert");
require("dotenv").config();
const mongoose = require("mongoose");
const Hotel = require("../models/hotel");
const Place = require("../models/place");
const Blog = require("../models/blog");
const TravelPackage = require("../models/package");
const Quote = require("../models/quote");
const { getOffers, findOfferByCode } = require("../services/offers");
const { generateAIPackage, extractFallback } = require("../services/ai");

test.after(async () => {
  await mongoose.disconnect();
});

test("Offers service retrieves valid MakeMyTrip style offers and discount codes", () => {
  const allOffers = getOffers("all");
  assert.ok(allOffers.length >= 8, "Expected at least 8 offers");
  
  const mmtKerala = findOfferByCode("MMTKERALA");
  assert.ok(mmtKerala, "Expected MMTKERALA offer to exist");
  assert.strictEqual(mmtKerala.discountValue, 15);
  assert.strictEqual(mmtKerala.discountType, "percent");

  const houseboatOffer = findOfferByCode("HOUSEBOAT3K");
  assert.ok(houseboatOffer, "Expected HOUSEBOAT3K offer to exist");
  assert.strictEqual(houseboatOffer.discountValue, 3000);
});

test("AI extraction parses travellers, dates, destination, budget, and must-haves", () => {
  const sample = "Hi, 2 adults and 1 kid, Kerala 5-6 nights in December, budget around 1.2 lakh total, houseboat a must";
  const fields = extractFallback(sample);
  assert.strictEqual(fields.destination.toLowerCase(), "kerala");
  assert.strictEqual(fields.mustHave, "Houseboat");
  assert.ok(fields.budget.includes("1.2 lakh"));
  assert.ok(fields.dates.includes("December"));
});

test("Database connectivity and sample packages PKG-KL-07 and PKG-SI-12", async () => {
  const MONGO_URL = process.env.ATLASTDB_URL || process.env.MONGODB_URI || process.env.MONGO_URL;
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URL);
  }

  const kl07 = await TravelPackage.findOne({ code: "PKG-KL-07" });
  assert.ok(kl07, "Sample package PKG-KL-07 must exist");
  assert.strictEqual(kl07.days, 6);
  assert.strictEqual(kl07.status, "published");
  assert.strictEqual(kl07.seasonalPrices[0].price, 32500);
  assert.strictEqual(kl07.seasonalPrices[1].price, 24900);

  const si12 = await TravelPackage.findOne({ code: "PKG-SI-12" });
  assert.ok(si12, "Sample package PKG-SI-12 must exist");
  assert.strictEqual(si12.days, 5);
  assert.strictEqual(si12.status, "draft");
  assert.strictEqual(si12.seasonalPrices[0].price, 18750);
});

test("Curated hotels and sightseeing places according to location exist", async () => {
  const munnarHotels = await Hotel.find({ location: "Munnar" });
  assert.ok(munnarHotels.length >= 2, "Expected at least 2 Munnar hotels");

  const alleppeyHotels = await Hotel.find({ location: "Alleppey" });
  assert.ok(alleppeyHotels.length >= 2, "Expected at least 2 Alleppey stays/houseboats");

  const munnarPlaces = await Place.find({ location: "Munnar" });
  assert.ok(munnarPlaces.length >= 2, "Expected at least 2 Munnar sightseeing spots");
});

test("AI Package Generator dynamically creates custom packages with hotels and pricing", async () => {
  const plan = await generateAIPackage({
    destination: "Munnar, Thekkady and Alleppey",
    days: 6,
    travellers: "2 Adults, 1 Kid",
    budget: "₹1.2 Lakh Total",
    mustHave: "Houseboat a must",
    fareType: "Armed Forces",
    promoCode: "MMTKERALA"
  });

  assert.ok(plan.code.startsWith("AI-PK-"));
  assert.ok(plan.title && plan.title.length > 5, "Plan should have a valid title");
  assert.strictEqual(plan.days, 6);
  assert.strictEqual(plan.itinerary.length, 6);
  assert.ok(plan.pricing.discountedPrice > 0);
  assert.ok(plan.pricing.gstAmount > 0);
  assert.ok(plan.recommendedHotels.length > 0);
});
