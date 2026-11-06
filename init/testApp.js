require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const app = require("../app.js");

// We can test route handlers or make real HTTP requests against the running app
async function runTests() {
  const MONGO_URL = process.env.ATLASTDB_URL || process.env.MONGODB_URI || process.env.MONGO_URL || "mongodb://127.0.0.1:27017/wanderlust";
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URL);
  }

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running on ${baseUrl}`);

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ FAIL: ${name}:`, err.message);
      failed++;
    }
  }

  // 1. Home Page
  await test("GET / renders home page with MakeMyTrip features & offers", async () => {
    const res = await fetch(`${baseUrl}/`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const text = await res.text();
    if (!text.includes("Holiday Packages")) throw new Error("Missing Holiday Packages tab");
    if (!text.includes("special fare")) throw new Error("Missing special fare section");
    if (!text.includes("Offers")) throw new Error("Missing Offers section");
    if (!text.includes("MMTKERALA")) throw new Error("Missing MMTKERALA offer code");
    if (!text.includes("Curated Hotels & Places by Location")) throw new Error("Missing location hotels section");
    if (!text.includes("Fragrant Nature Munnar")) throw new Error("Missing seeded hotel");
  });

  // 2. Journeys List
  await test("GET /journeys renders packages with filters", async () => {
    const res = await fetch(`${baseUrl}/journeys`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const text = await res.text();
    if (!text.includes("Find your South India story")) throw new Error("Missing journeys heading");
    if (!text.includes("Munnar, Thekkady and Alleppey houseboat")) throw new Error("Missing sample package");
  });

  // 3. Explore Stays by Location
  await test("GET /explore renders hotels and sights according to location", async () => {
    const res = await fetch(`${baseUrl}/explore?location=Alleppey`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const text = await res.text();
    if (!text.includes("Alleppey")) throw new Error("Missing Alleppey");
    if (!text.includes("Marvel Luxury Private Houseboat")) throw new Error("Missing Alleppey houseboat");
  });

  // 4. Custom Package Builder
  await test("GET /custom-package renders builder with live price calculator", async () => {
    const res = await fetch(`${baseUrl}/custom-package`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const text = await res.text();
    if (!text.includes("Design Your Custom South India Journey")) throw new Error("Missing builder heading");
    if (!text.includes("STEP 1")) throw new Error("Missing Step 1");
    if (!text.includes("Estimated Investment")) throw new Error("Missing pricing calculation panel");
  });

  // 5. AI Trip Planner Page
  await test("GET /ai-planner renders AI trip planner", async () => {
    const res = await fetch(`${baseUrl}/ai-planner`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const text = await res.text();
    if (!text.includes("AI Journey Planner for Kerala & South India")) throw new Error("Missing AI planner heading");
    if (!text.includes("Generate Custom AI Package Now")) throw new Error("Missing generate button");
  });

  // 6. AI Package Generator API
  await test("POST /api/ai/generate-package returns structured AI itinerary and hotel recommendations", async () => {
    const res = await fetch(`${baseUrl}/api/ai/generate-package`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destination: "Munnar and Alleppey",
        days: 5,
        travellers: "2 Adults, 1 Child",
        budget: "₹80,000",
        mustHave: "Houseboat a must",
        fareType: "Armed Forces",
        promoCode: "MMTKERALA"
      })
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    if (!json.success || !json.package) throw new Error("Invalid response format");
    if (!json.package.title) throw new Error("Missing package title");
    if (!json.package.itinerary || json.package.itinerary.length !== 5) throw new Error(`Expected 5 itinerary days, got ${json.package.itinerary?.length}`);
    if (!json.package.pricing.discountedPrice) throw new Error("Missing discounted price");
    if (!json.package.pricing.gstAmount) throw new Error("Missing GST calculation");
    console.log(`   Generated: ${json.package.title} (${json.package.code}), Price ₹${json.package.pricing.totalPrice}`);
  });

  // 7. Blogs Listing & Detail
  await test("GET /blogs renders blogs and GET /blogs/:slug renders article with related packages", async () => {
    const resList = await fetch(`${baseUrl}/blogs`);
    if (resList.status !== 200) throw new Error(`List status ${resList.status}`);
    const listText = await resList.text();
    if (!listText.includes("Stories from South India")) throw new Error("Missing blog list heading");

    const resSingle = await fetch(`${baseUrl}/blogs/ultimate-kerala-backwaters-guide-houseboat-routes`);
    if (resSingle.status !== 200) throw new Error(`Single status ${resSingle.status}`);
    const singleText = await resSingle.text();
    if (!singleText.includes("The Ultimate Kerala Backwaters Guide")) throw new Error("Missing article title");
    if (!singleText.includes("Handcrafted Journeys for this Guide")) throw new Error("Missing related packages section");
  });

  // 8. Package Detail Page (PKG-KL-07)
  await test("GET /journeys/munnar-thekkady-and-alleppey-houseboat renders PKG-KL-07 details", async () => {
    const res = await fetch(`${baseUrl}/journeys/munnar-thekkady-and-alleppey-houseboat`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const text = await res.text();
    if (!text.includes("PKG-KL-07")) throw new Error("Missing PKG-KL-07 code");
    if (!text.includes("32,500")) throw new Error("Missing Peak price 32,500");
    if (!text.includes("24,900")) throw new Error("Missing Monsoon price 24,900");
    if (!text.includes("Special Fare Category")) throw new Error("Missing special fare in enquiry");
  });

  // 9. Sitemap XML
  await test("GET /sitemap.xml returns valid sitemap XML", async () => {
    const res = await fetch(`${baseUrl}/sitemap.xml`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const xml = await res.text();
    if (!xml.includes("<urlset")) throw new Error("Missing <urlset");
    if (!xml.includes("/journeys/munnar-thekkady-and-alleppey-houseboat")) throw new Error("Missing package URL");
    if (!xml.includes("/blogs/ultimate-kerala-backwaters-guide-houseboat-routes")) throw new Error("Missing blog URL");
  });

  console.log(`\nTest Summary: ${passed} Passed, ${failed} Failed.`);
  server.close();
  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

