// Run once after your listing seed: npm run seed:travel
// It reuses the first 30 existing Cloudinary listing images as package artwork.
require("dotenv").config();
const mongoose = require("mongoose");
const Listing = require("../models/listing");
const TravelPackage = require("../models/package");
const slugify = require("../utils/slug");
const uri = process.env.ATLASTDB_URL || process.env.MONGODB_URI || process.env.MONGO_URL || "mongodb://127.0.0.1:27017/wanderlust";
const places = ["Munnar, Thekkady & Alleppey","Madurai, Rameswaram & Kanyakumari","Wayanad, Calicut & Bekal","Kerala, Unhurried","Fort Kochi & Backwaters","Munnar Tea Country Escape","Alleppey Houseboat Weekend","Thekkady Wild Trails","Varkala Coast & Ayurveda","Kovalam & Poovar","Kannur Theyyam Trail","Athirappilly & Valparai","Kumarakom Lakeside Retreat","Marari Beach Stay","Thrissur Culture & Coast","Palakkad & Silent Valley","Ooty, Coonoor & Coimbatore","Mysore & Coorg","Pondicherry Slow Escape","Chennai to Mahabalipuram","Hampi Heritage Trail","Bengaluru & Kabini","Tamil Nadu Temple Journey","Chettinad & Karaikudi","Kodaikanal Hills","Yercaud Weekend","Goa Heritage & Coast","Gokarna Coastal Hideaway","Hyderabad & Hampi","South India Grand Journey"];
async function seed() {
  await mongoose.connect(uri); const images = await Listing.find().select("image").limit(30).lean(); const fallbackImage = images.find(row => row.image?.url)?.image || {};
  const docs = places.map((title, i) => { const days = 3 + i % 7, price = 17500 + i * 1450; return { code:`PKG-${i < 16 ? "KL" : "SI"}-${String(i+1).padStart(2,"0")}`, title, slug:slugify(title), subtitle:"A thoughtfully paced South India journey", coordinates:[76.2673 + i/20,9.9312 + i/30], days, nights:days-1, hotelCategory:i%3===0?"5 star":"4 star", image:images[i]?.image?.url ? images[i].image : fallbackImage, destinations:title.split(/,|&/).map(x=>x.trim()), description:`A private, thoughtfully paced journey through ${title}, made for travellers who want to experience South India with more care and less rush.`, itinerary:Array.from({length:days},(_,j)=>({day:j+1,title:j?"A considered day in the journey":`Arrive in ${title.split(",")[0]}`,description:"Time for local experiences, comfortable private transfers and the freedom to travel at your own pace."})), inclusions:["Accommodation","Private transfers","Daily breakfast","Local experiences as listed"], seasonalPrices:[{label:"Peak · Oct–Mar",price},{label:"Green season · Jun–Sep",price:Math.round(price*.82)}], status:"published" }; });
  await TravelPackage.deleteMany({}); await TravelPackage.insertMany(docs); console.log(`Seeded ${docs.length} packages using ${images.filter(x=>x.image?.url).length} existing Cloudinary images.`); await mongoose.disconnect();
}
seed().catch(err=>{console.error(err);process.exitCode=1});
