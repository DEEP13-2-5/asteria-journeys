const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const MONGO_URL =
  process.env.ATLASTDB_URL ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URL ||
  "mongodb://127.0.0.1:27017/wanderlust";


main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  const defaultCategories = [
    "Trending",
    "Rooms",
    "Iconic Cities",
    "Mountains",
    "Castles",
    "Amazing-Pools",
    "Camping",
    "Farms",
    "Beach",
    "Others",
  ];

  await Listing.deleteMany({});
  initData.data = initData.data.map((obj, index) => ({
    ...obj,
    owner: "66c88b9e2054e2e32ce548e0",
    category: obj.category || defaultCategories[index % defaultCategories.length],
    geometry: obj.geometry || {
      type: "Point",
      coordinates: [77.209, 28.6139],
    },
  }));
  await Listing.insertMany(initData.data);
  console.log("data was initialized");
};

initDB()
  .catch((err) => {
    console.log(err);
  })
  .finally(() => {
    mongoose.connection.close();
  });