const Package = require("../models/package");
const Hotel = require("../models/hotel");
const Place = require("../models/place");

function extractFallback(text, input = {}) {
  const haystack = `${text || ""} ${input.travelDates || ""} ${input.travellers || ""}`;
  const budget = haystack.match(/(?:budget\s*(?:is|around|of|:)?\s*)?(?:₹|rs\.?|inr)\s*([\d,.]+(?:\s*(?:lakh|lac|k|thousand))?)|(?:budget\s*(?:is|around|of|:)?\s*)([\d,.]+(?:\s*(?:lakh|lac|k|thousand))?)|([\d,.]+\s*(?:lakh|lac))/i);
  const budgetVal = budget ? (budget[1] || budget[2] || budget[3] || budget[0]).trim() : "Needs review";
  const people = haystack.match(/\b\d+\s*(?:adults?|people|travellers?|guests?|kids?|children)\b/i);
  const dates = haystack.match(/\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[^,.]{0,25}/i);
  const destination = /(kerala|munnar|alleppey|thekkady|wayanad|kochi|cochin|madurai|rameswaram|kanyakumari|kovalam|kumarakom|ooty|coorg)/i.exec(haystack);
  return {
    dates: input.travelDates || (dates ? dates[0].trim() : "Needs review"),
    travellers: input.travellers || (people ? people[0].trim() : "2 Adults"),
    destination: destination ? destination[0] : "Kerala / South India",
    budget: budgetVal,
    mustHave: /houseboat/i.test(haystack) ? "Houseboat" : (/ayurved/i.test(haystack) ? "Ayurvedic Spa" : "Private cab & sightseeing"),
  };
}

async function suggestPackages(fields) {
  const query = fields.destination === "Kerala / South India"
    ? { status: "published", deletedAt: null }
    : { status: "published", deletedAt: null, $text: { $search: fields.destination } };
  
  let matches = [];
  try {
    matches = await Package.find(query).limit(3);
  } catch (_) {
    matches = await Package.find({ status: "published", deletedAt: null }).limit(3);
  }

  if (matches.length >= 3) return matches;
  const remaining = await Package.find({
    status: "published",
    deletedAt: null,
    _id: { $nin: matches.map(pkg => pkg._id) }
  }).limit(3 - matches.length);
  return [...matches, ...remaining];
}

async function enrichEnquiry(input) {
  const fallback = extractFallback(input.message, input);
  const suggestions = await suggestPackages(fallback);
  let fields = fallback;

  if (process.env.OPENROUTER_API_KEY) {
    try {
      const candidateSummary = suggestions.map((pkg, index) => `${index + 1}. ${pkg.title} (${pkg.days} days; ${pkg.destinations.join(", ")})`).join("\n");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "Return compact JSON with keys dates, travellers, destination, budget, mustHave, personalizedPlan, draftReply. Extract only stated facts. personalizedPlan explains, in 2 concise sentences, how the traveller's stated needs fit the provided package candidates; it must mention only candidates supplied and never state or invent prices. draftReply is warm, concise, and says a consultant will confirm details. Never invent facts, prices, or promises."
            },
            {
              role: "user",
              content: `Enquiry:\n${input.message}\n\nAvailable package candidates:\n${candidateSummary}`
            }
          ]
        }),
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const raw = await response.json();
        const content = raw.choices?.[0]?.message?.content || "";
        const m = content.match(/\{[\s\S]*\}/);
        if (m) {
          const candidate = JSON.parse(m[0]);
          const usable = Object.fromEntries(Object.entries(candidate).filter(([, value]) => typeof value === "string" && value.trim()));
          fields = { ...fallback, ...usable };
        }
      }
    } catch (_) {
      // Fallback extraction is always resilient and never blocks user workflow
    }
  }

  return {
    ...fields,
    suggestions: suggestions.map((pkg) => pkg._id),
    personalizedPlan: fields.personalizedPlan || `Based on the dates, group size and preferences shared, these journeys are the closest fit. Your consultant will tailor the final day plan and confirm the applicable seasonal price.`,
    draftReply: fields.draftReply || `Thank you for reaching out, ${input.name || "valued guest"}. We have received your enquiry and an Asteria journey consultant in Kochi will reply within the hour.`
  };
}

/**
 * AI Custom Package Generator:
 * Literally calls OpenRouter LLM to craft a customized, day-by-day South India holiday plan,
 * pairing handpicked hotels from the database and applying transparent pricing rules.
 */
async function generateAIPackage(criteria = {}) {
  const destination = (criteria.destination || "Kerala Backwaters & Munnar Hills").trim();
  const days = Math.max(3, Math.min(12, Number(criteria.days) || 5));
  const nights = days - 1;
  const travellers = criteria.travellers || "2 Adults";
  const budget = criteria.budget || "₹75,000";
  const mustHave = criteria.mustHave || "Houseboat & tea gardens";
  const fareType = criteria.fareType || "Regular";

  // Match locations from destination string
  const locRegex = /(munnar|alleppey|thekkady|kochi|cochin|wayanad|kovalam|varkala|kumarakom|madurai|rameswaram|kanyakumari)/gi;
  let detectedLocations = [];
  let m;
  while ((m = locRegex.exec(destination)) !== null) {
    const norm = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
    const clean = norm === "Cochin" ? "Kochi" : norm;
    if (!detectedLocations.includes(clean)) detectedLocations.push(clean);
  }

  if (detectedLocations.length === 0) {
    detectedLocations = ["Kochi", "Munnar", "Thekkady", "Alleppey"];
  }

  // Fallback defaults
  let aiTitle = `AI-Crafted: ${detectedLocations.join(" · ")} Private Journey`;
  let aiSubtitle = `${days} Days / ${nights} Nights curated private journey tailored for ${travellers}`;
  let aiDescription = `A custom-engineered itinerary designed specifically for ${travellers} with a focus on ${mustHave}. Seamless private transfers, verified boutique stays, and authentic local experiences.`;
  let aiItinerary = null;
  let aiInclusions = null;

  // 1. LITERALLY CALL OPENROUTER LLM IF KEY IS PRESENT
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const prompt = `Plan a ${days}-day / ${nights}-night bespoke South India / Kerala private holiday for ${travellers}.
Destinations / Region: ${destination}
Budget: ${budget}
Must-Haves & Preferences: ${mustHave}
Fare Category: ${fareType}

Return strictly a JSON object with these keys:
{
  "title": "Creative and evocative journey title",
  "subtitle": "Short pacing subtitle",
  "description": "Inspiring 2-3 sentence overview explaining how this plan fulfills their wish for ${mustHave}",
  "destinations": ["Array", "of", "destinations", "visited"],
  "itinerary": [
    {
      "day": 1,
      "title": "Day 1 title",
      "description": "Detailed morning, afternoon and evening activities"
    }
  ],
  "inclusions": ["Specific tailored inclusions matching their requirements"]
}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 14000);

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are Asteria Journeys' chief travel architect in Kochi, Kerala. Create luxurious, unhurried, slow-travel South India holiday itineraries. Output valid JSON only."
            },
            {
              role: "user",
              content: prompt
            }
          ]
        })
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const rawJson = await response.json();
        const content = rawJson.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.title) aiTitle = parsed.title.startsWith("AI-Crafted") ? parsed.title : `AI-Crafted: ${parsed.title}`;
          if (parsed.subtitle) aiSubtitle = parsed.subtitle;
          if (parsed.description) aiDescription = parsed.description;
          if (Array.isArray(parsed.destinations) && parsed.destinations.length) {
            detectedLocations = parsed.destinations;
          }
          if (Array.isArray(parsed.itinerary) && parsed.itinerary.length) {
            aiItinerary = parsed.itinerary.map((item, idx) => ({
              day: item.day || (idx + 1),
              title: item.title || `Day ${idx + 1}`,
              description: item.description || "Scenic exploration and private transfers."
            }));
          }
          if (Array.isArray(parsed.inclusions) && parsed.inclusions.length) {
            aiInclusions = parsed.inclusions;
          }
          console.log(`[AI Planner] OpenRouter LLM (${process.env.OPENROUTER_MODEL || "OpenRouter"}) generated plan: "${aiTitle}"`);
        }
      }
    } catch (llmErr) {
      console.warn("[AI Planner] OpenRouter LLM call timed out or failed, using expert regional fallback:", llmErr.message);
    }
  }

  // 2. Fetch relevant hotels from DB for the AI-detected locations
  const hotelsInLocations = await Hotel.find({
    location: { $in: detectedLocations.map(l => new RegExp(l, "i")) }
  }).lean();

  const placesInLocations = await Place.find({
    location: { $in: detectedLocations.map(l => new RegExp(l, "i")) }
  }).lean();

  // 3. Fallback itinerary if LLM did not provide it
  const itinerary = aiItinerary || [];
  if (itinerary.length === 0) {
    for (let i = 1; i <= days; i++) {
      const loc = detectedLocations[(i - 1) % detectedLocations.length];
      const place = placesInLocations.find(p => p.location.toLowerCase() === loc.toLowerCase());
      
      if (i === 1) {
        itinerary.push({
          day: 1,
          title: `Arrival in ${detectedLocations[0]} · Scenic Drive & Check-in`,
          description: `Warm traditional welcome at the airport or station. Private chauffeur transfer to ${loc}. Check into your resort and spend a relaxing evening enjoying the scenic surroundings.`
        });
      } else if (i === days) {
        itinerary.push({
          day: days,
          title: `Farewell ${detectedLocations[detectedLocations.length - 1]} · Departure`,
          description: `Delightful breakfast at the resort. Morning time for souvenir spice shopping or boutique crafts. Private transfer to the airport or railway station with treasured memories.`
        });
      } else if (loc.toLowerCase().includes("alleppey") || /houseboat/i.test(mustHave) && i === days - 1) {
        itinerary.push({
          day: i,
          title: `Alleppey Backwaters · Private Luxury Houseboat Cruise`,
          description: `Board your traditional air-conditioned Kettuvallam houseboat by noon. Glide along palm-bordered canals and paddy fields. Freshly prepared Karimeen pearl spot dinner on board under the stars.`
        });
      } else {
        itinerary.push({
          day: i,
          title: `Exploring ${loc} · ${place ? place.name : "Nature, Plantations & Culture"}`,
          description: `Morning visit to ${place ? place.name : "local scenic viewpoints"}. Afternoon guided walk through lush plantations and tranquil country trails. Evening cultural show or Ayurvedic wellness session.`
        });
      }
    }
  }

  // 4. Inclusions
  const inclusions = aiInclusions || [
    `${nights} nights accommodation in handpicked properties on twin sharing basis`,
    /houseboat/i.test(mustHave) ? "1 night private AC luxury houseboat in Alleppey with all meals included" : "Premium boutique resort stays",
    "Daily gourmet breakfast at all hotels and resorts",
    "Exclusive private AC Sedan / Innova for all transfers and sightseeing",
    "Dedicated chauffeur with all fuel, interstate permits, tolls and parking included",
    "24/7 on-tour concierge support from Asteria's Kochi operations desk"
  ];

  // 5. Pick top recommended hotels from DB for each location
  const recommendedHotels = [];
  detectedLocations.forEach(loc => {
    const found = hotelsInLocations.filter(h => h.location.toLowerCase() === loc.toLowerCase());
    if (found.length) {
      recommendedHotels.push(found[0]);
    }
  });

  // 6. Pricing Calculation
  const baseRatePerDay = 4800;
  const rawBase = baseRatePerDay * days;
  
  let fareDiscount = 0;
  if (fareType === "Armed Forces" || fareType === "Senior Citizen" || fareType === "Doctor and Nurses") {
    fareDiscount = 600;
  } else if (fareType === "Student") {
    fareDiscount = 500;
  } else if (fareType === "Have a GST number?") {
    fareDiscount = Math.round(rawBase * 0.08);
  }

  let promoDiscount = 0;
  if (criteria.promoCode) {
    const code = criteria.promoCode.toUpperCase();
    if (code === "MMTKERALA") promoDiscount = Math.min(5000, Math.round(rawBase * 0.15));
    else if (code === "HOUSEBOAT3K") promoDiscount = 3000;
    else if (code === "ICICITRAVEL" || code === "BANKFEST25") promoDiscount = 2500;
    else if (code === "MMTDIWALI") promoDiscount = Math.min(4000, Math.round(rawBase * 0.12));
    else promoDiscount = 1000;
  }

  const discountedPrice = Math.max(9900, rawBase - fareDiscount - promoDiscount);
  const gstAmount = Math.round(discountedPrice * 0.05); // 5% GST
  const totalPrice = discountedPrice + gstAmount;
  const code = `AI-PK-${Math.floor(1000 + Math.random() * 9000)}`;

  return {
    code,
    title: aiTitle,
    subtitle: aiSubtitle,
    description: aiDescription,
    days,
    nights,
    destinations: detectedLocations,
    hotelCategory: recommendedHotels[0]?.starCategory || "4 star",
    recommendedHotels,
    itinerary,
    inclusions,
    pricing: {
      regularPrice: rawBase,
      discountedPrice,
      fareType,
      fareDiscount,
      promoDiscount,
      promoCode: criteria.promoCode || "",
      gstPercent: 5,
      gstAmount,
      totalPrice,
      pricePerPerson: discountedPrice,
      twinSharingNote: "Prices are per person on twin sharing basis. 5% GST is clearly itemized."
    }
  };
}

module.exports = {
  enrichEnquiry,
  generateAIPackage,
  extractFallback,
  suggestPackages
};
