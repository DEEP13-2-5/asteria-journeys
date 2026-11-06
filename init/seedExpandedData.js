require("dotenv").config();
const mongoose = require("mongoose");
const TravelPackage = require("../models/package");
const Hotel = require("../models/hotel");
const Place = require("../models/place");
const Blog = require("../models/blog");
const Enquiry = require("../models/enquiry");
const slugify = require("../utils/slug");
const { enrichEnquiry } = require("../services/ai");

const uri = process.env.ATLASTDB_URL || process.env.MONGODB_URI || process.env.MONGO_URL || "mongodb://127.0.0.1:27017/wanderlust";

const hotelsData = [
  // Munnar
  {
    name: "Fragrant Nature Munnar",
    location: "Munnar",
    starCategory: "5 star",
    pricePerNight: 9500,
    rating: 4.9,
    reviewsCount: 342,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    amenities: ["Tea Garden View", "Ayurvedic Spa", "Fireplace", "Free WiFi", "Fine Dining"],
    description: "Nestled amidst misty tea hills in Pothamedu, offering private balconies overlooking verdant valleys.",
    coordinates: [77.0595, 10.0889],
    isFeatured: true
  },
  {
    name: "Windermere Estate Munnar",
    location: "Munnar",
    starCategory: "4 star",
    pricePerNight: 7200,
    rating: 4.8,
    reviewsCount: 280,
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
    amenities: ["Cardamom Plantation Walk", "Mountain Balcony", "Campfire", "Restaurant"],
    description: "Charming heritage rooms within an active coffee and cardamom plantation high above Munnar.",
    coordinates: [77.0620, 10.0850],
    isFeatured: true
  },
  {
    name: "Tea County Munnar (KTDC)",
    location: "Munnar",
    starCategory: "3 star",
    pricePerNight: 4500,
    rating: 4.4,
    reviewsCount: 195,
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
    amenities: ["Valley View", "Ayurveda Centre", "Indoor Games", "Multi-cuisine Dining"],
    description: "Conveniently perched on two hills in the heart of Munnar, ideal for families and easy town access.",
    coordinates: [77.0600, 10.0900],
    isFeatured: false
  },

  // Alleppey
  {
    name: "Marvel Luxury Private Houseboat",
    location: "Alleppey",
    starCategory: "Premium Houseboat",
    pricePerNight: 14000,
    rating: 4.9,
    reviewsCount: 412,
    image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80",
    amenities: ["Private Chef", "AC Bedrooms", "Upper Deck Sunset Lounge", "All Meals Included", "Village Cruise"],
    description: "Handcrafted traditional Kettuvallam with glass-walled AC bedrooms and personal chef serving fresh Karimeen fish.",
    coordinates: [76.3388, 9.4981],
    isFeatured: true
  },
  {
    name: "Punnamada Backwater Resort",
    location: "Alleppey",
    starCategory: "4 star",
    pricePerNight: 8500,
    rating: 4.7,
    reviewsCount: 220,
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
    amenities: ["Vembanad Lakefront", "Ayurveda Wellness", "Swimming Pool", "Speedboat Safari"],
    description: "Traditional Kerala heritage villas on the banks of Punnamada Lake, host of the Nehru Trophy Boat Race.",
    coordinates: [76.3500, 9.5100],
    isFeatured: true
  },
  {
    name: "Palmy Lake Heritage Homestay",
    location: "Alleppey",
    starCategory: "3 star",
    pricePerNight: 3800,
    rating: 4.5,
    reviewsCount: 140,
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
    amenities: ["Canal Canoe Ride", "Home Cooked Kerala Meals", "Waterfront Verandah"],
    description: "Cozy canal-side retreat hosted by a warm local family offering genuine Kuttanad hospitality.",
    coordinates: [76.3400, 9.4900],
    isFeatured: false
  },

  // Thekkady
  {
    name: "Spice Village (CGH Earth)",
    location: "Thekkady",
    starCategory: "5 star",
    pricePerNight: 11000,
    rating: 4.9,
    reviewsCount: 310,
    image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80",
    amenities: ["Thatched Roof Cottages", "Organic Spice Garden", "Tiger Reserve Border", "Eco Pool"],
    description: "An eco-luxe tribal village model crafted from elephant grass and native timber, celebrating spice hills.",
    coordinates: [77.1668, 9.6031],
    isFeatured: true
  },
  {
    name: "Elephant Court Thekkady",
    location: "Thekkady",
    starCategory: "4 star",
    pricePerNight: 6800,
    rating: 4.7,
    reviewsCount: 260,
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
    amenities: ["Ayurashram Spa", "Periyar Safari Desk", "Jacuzzi Suites", "Spice Garden"],
    description: "Teak-wood architecture set among pepper vines, just minutes from the Periyar Tiger Reserve gate.",
    coordinates: [77.1680, 9.6050],
    isFeatured: true
  },

  // Kochi
  {
    name: "Brunton Boatyard (Fort Kochi)",
    location: "Kochi",
    starCategory: "5 star",
    pricePerNight: 12500,
    rating: 4.9,
    reviewsCount: 480,
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
    amenities: ["Harbour View", "Historical Architecture", "Sunset Pier", "Seafood Restaurant"],
    description: "Restored Victorian shipyard at the mouth of Cochin Harbour, watching ships and dolphins glide past.",
    coordinates: [76.2415, 9.9654],
    isFeatured: true
  },
  {
    name: "Old Harbour Hotel",
    location: "Kochi",
    starCategory: "4 star",
    pricePerNight: 8200,
    rating: 4.8,
    reviewsCount: 320,
    image: "https://images.unsplash.com/photo-1568084680786-a84f91d1153c?auto=format&fit=crop&w=800&q=80",
    amenities: ["Dutch Heritage", "Garden Plunge Pool", "Organic Bistro", "Art Gallery"],
    description: "300-year-old Dutch colonial residence steps from the famous Chinese Fishing Nets and St. Francis Church.",
    coordinates: [76.2420, 9.9670],
    isFeatured: true
  },

  // Wayanad
  {
    name: "Vythiri Resort Treehouse",
    location: "Wayanad",
    starCategory: "5 star",
    pricePerNight: 13500,
    rating: 4.8,
    reviewsCount: 390,
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    amenities: ["Canopy Treehouses", "Natural Mountain Stream", "Rainforest Spa", "Suspension Bridge"],
    description: "Secluded rainforest sanctuary featuring authentic bamboo treehouses 80 feet above the forest floor.",
    coordinates: [76.0382, 11.5385],
    isFeatured: true
  },

  // Kovalam
  {
    name: "The Leela Kovalam Cliff Resort",
    location: "Kovalam",
    starCategory: "5 star",
    pricePerNight: 16000,
    rating: 4.9,
    reviewsCount: 520,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    amenities: ["Cliff Edge Infinity Pool", "Private Beach", "Arabian Sea Sunset View", "Divya Ayurveda"],
    description: "India's only cliff-top beach resort nestled between wide beaches overlooking the endless Arabian Sea.",
    coordinates: [76.9787, 8.3988],
    isFeatured: true
  },

  // Madurai
  {
    name: "Heritage Madurai",
    location: "Madurai",
    starCategory: "4 star",
    pricePerNight: 6500,
    rating: 4.7,
    reviewsCount: 230,
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
    amenities: ["Geoffrey Bawa Architecture", "Temple Plunge Pool", "Banyan Courtyard"],
    description: "Designed by legendary architect Geoffrey Bawa, blending centuries of Tamil stone carving with quiet serenity.",
    coordinates: [78.1198, 9.9252],
    isFeatured: true
  },

  // Kanyakumari
  {
    name: "Sparsa Resort Kanyakumari",
    location: "Kanyakumari",
    starCategory: "4 star",
    pricePerNight: 5800,
    rating: 4.6,
    reviewsCount: 190,
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
    amenities: ["Triveni Sangam View", "Oceanfacing Lawn", "Vegetarian & Seafood Dining"],
    description: "Positioned where three oceans meet, offering unobstructed sunrise views over the Vivekananda Memorial.",
    coordinates: [77.5385, 8.0883],
    isFeatured: true
  }
];

const placesData = [
  // Munnar
  {
    name: "Eravikulam National Park & Rajamalai",
    location: "Munnar",
    category: "Wildlife & Nature",
    bestTimeToVisit: "8:30 AM – 11:30 AM",
    duration: "3-4 hours",
    image: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80",
    description: "Habitat of the endangered Nilgiri Tahr and home to Anamudi, South India's highest mountain peak.",
    highlights: ["Nilgiri Tahr spotting", "Rolling grasslands", "Panoramic Western Ghats views"]
  },
  {
    name: "Mattupetty Dam & Kundala Lake",
    location: "Munnar",
    category: "Lakes & Boating",
    bestTimeToVisit: "10:00 AM – 4:00 PM",
    duration: "2 hours",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    description: "Scenic masonry dam surrounded by green tea plantations and dense forests where wild elephants frequent.",
    highlights: ["Speedboat rides", "Tea plantation photo points", "Echo Point echo calls"]
  },
  {
    name: "KDHP Tea Museum & Factory Tour",
    location: "Munnar",
    category: "Heritage & Tea",
    bestTimeToVisit: "9:00 AM – 1:00 PM",
    duration: "1.5 hours",
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80",
    description: "Discover the 140-year story of Munnar's tea industry with live orthodox tea processing and guided tea tastings.",
    highlights: ["Tea tasting session", "Colonial tea machinery", "Handcrafted CTC teas"]
  },

  // Alleppey
  {
    name: "Vembanad Backwaters & Punnamada Lake",
    location: "Alleppey",
    category: "Backwaters & Cruise",
    bestTimeToVisit: "12:00 PM – 5:30 PM",
    duration: "Full day / Overnight",
    image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80",
    description: "The emerald network of canals, paddy fields below sea level, and tranquil palm-fringed waterways.",
    highlights: ["Houseboat cruise", "Canal village life", "Sunset over coconut lagoons"]
  },
  {
    name: "Marari Beach & Fishermen Cove",
    location: "Alleppey",
    category: "Beaches",
    bestTimeToVisit: "4:00 PM – 6:30 PM",
    duration: "2-3 hours",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    description: "An unspoiled, quiet stretch of golden sand known for sway coconut palms and peaceful sunset walks.",
    highlights: ["Traditional fishing boats", "Clean swimming waters", "Sunset cafes"]
  },

  // Thekkady
  {
    name: "Periyar Wildlife Sanctuary Boat Safari",
    location: "Thekkady",
    category: "Wildlife Safari",
    bestTimeToVisit: "7:00 AM or 3:30 PM",
    duration: "2 hours",
    image: "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=800&q=80",
    description: "Cruise on the calm waters of Periyar Lake with chances of spotting wild elephant herds, sambar deer, and otters.",
    highlights: ["Wild elephant sightings", "Submerged tree trunks", "Bird watching"]
  },
  {
    name: "Abraham's Spice Garden Walk",
    location: "Thekkady",
    category: "Spice Plantations",
    bestTimeToVisit: "9:00 AM – 11:30 AM",
    duration: "1.5 hours",
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80",
    description: "In-depth sensory walk exploring green cardamom, black pepper, cinnamon, vanilla pods, and Ayurvedic herbs.",
    highlights: ["Fresh spice tasting", "Organic farming tips", "Authentic farm shop"]
  },

  // Kochi
  {
    name: "Fort Kochi Chinese Fishing Nets & Walk",
    location: "Kochi",
    category: "Heritage & Culture",
    bestTimeToVisit: "5:00 PM – 7:00 PM",
    duration: "2 hours",
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
    description: "Cantilevered shore-operated fishing nets gifted by 14th-century Chinese traders against dramatic sunsets.",
    highlights: ["Operating the giant nets", "Colonial street cafes", "Fresh catch grill stalls"]
  },
  {
    name: "Mattancherry Palace & Jew Town",
    location: "Kochi",
    category: "Heritage & Antiques",
    bestTimeToVisit: "10:00 AM – 2:00 PM",
    duration: "2.5 hours",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
    description: "Ramayana murals at the Dutch Palace and centuries-old spice warehouses converted into antique curiosities.",
    highlights: ["Paradesi Synagogue", "Ancient wooden carvings", "Spice market scents"]
  },

  // Madurai
  {
    name: "Meenakshi Amman Temple",
    location: "Madurai",
    category: "Architecture & Spirituality",
    bestTimeToVisit: "6:00 AM or 6:30 PM",
    duration: "3 hours",
    image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80",
    description: "Masterpiece of Dravidian architecture featuring 14 towering multi-coloured Gopurams and the Hall of 1000 Pillars.",
    highlights: ["Night ceremony procession", "Hall of Thousand Pillars", "Intricate stone sculptures"]
  },

  // Kanyakumari
  {
    name: "Vivekananda Rock Memorial & Thiruvalluvar Statue",
    location: "Kanyakumari",
    category: "Monuments & Ocean",
    bestTimeToVisit: "8:00 AM – 11:00 AM or 4:00 PM",
    duration: "2 hours",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
    description: "Offshore rock monument where Swami Vivekananda attained enlightenment, where three oceans converge.",
    highlights: ["Ferry ride across confluence", "Meditation mandapam", "133-ft stone Thiruvalluvar statue"]
  }
];

async function seedData() {
  await mongoose.connect(uri);
  console.log("Connected to MongoDB for Expanded Seeding...");

  // 1. Seed / Upsert Hotels
  await Hotel.deleteMany({});
  await Hotel.insertMany(hotelsData);
  console.log(`Seeded ${hotelsData.length} curated hotels across locations.`);

  // 2. Seed / Upsert Places
  await Place.deleteMany({});
  await Place.insertMany(placesData);
  console.log(`Seeded ${placesData.length} curated sightseeing places across locations.`);

  // 3. Ensure Sample Packages PKG-KL-07 and PKG-SI-12 exist with exact specification from brief
  const samplePkg1 = {
    code: "PKG-KL-07",
    title: "Munnar, Thekkady and Alleppey houseboat",
    slug: "munnar-thekkady-and-alleppey-houseboat",
    subtitle: "Kerala's iconic trio: misty hills, wild spice forests and private backwater cruising",
    description: "A private, 6-day journey connecting Kerala's greatest highlights. Wake up to misty tea plantations in Munnar, track elephants on a Periyar Lake boat safari, and spend an unforgettable night on a luxury air-conditioned houseboat floating through the Alleppey backwaters.",
    days: 6,
    nights: 5,
    hotelCategory: "4 star",
    image: {
      url: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=85",
      filename: "alleppey-houseboat.jpg"
    },
    destinations: ["Munnar", "Thekkady", "Alleppey", "Kochi"],
    inclusions: [
      "5 nights accommodation (4-star luxury resorts + 1 night private AC houseboat)",
      "All meals on houseboat (welcome drink, authentic Kerala lunch, tea & snacks, dinner, breakfast)",
      "Daily breakfast at all hotels",
      "Private air-conditioned chauffeur-driven Sedan / Innova for the entire tour",
      "Periyar Lake boat safari passes & Spice plantation guided walk",
      "All tolls, parking, fuel charges and driver allowances",
      "24/7 dedicated personal concierge support"
    ],
    itinerary: [
      {
        day: 1,
        title: "Arrive in Kochi · Journey to Munnar Hill Station",
        description: "Pick-up from Kochi airport or railway station. Drive through scenic green hills, stopping at Cheeyappara and Valara waterfalls. Check into your tea valley resort in Munnar. Evening at leisure overlooking misty peaks."
      },
      {
        day: 2,
        title: "Munnar Sightseeing · Tea Gardens & Eravikulam",
        description: "Morning visit to Eravikulam National Park to spot the rare Nilgiri Tahr. Afternoon tour of the KDHP Tea Museum with tea tasting, followed by a serene boat ride at Mattupetty Dam and Echo Point."
      },
      {
        day: 3,
        title: "Munnar to Thekkady · Spice Plantations & Periyar",
        description: "Scenic 3.5-hour drive down winding Ghat roads to Thekkady. Check into your jungle resort. Afternoon guided walk through cardamom, pepper, and cinnamon gardens. Evening optional Kathakali and Kalaripayattu martial arts show."
      },
      {
        day: 4,
        title: "Thekkady to Alleppey · Luxury Houseboat Check-in",
        description: "Drive to Alleppey backwaters. Board your private luxury houseboat by 12:30 PM with tender coconut welcome drinks. Cruise through narrow canals, watching village life and paddy fields below sea level. Freshly caught Karimeen fish dinner on board."
      },
      {
        day: 5,
        title: "Alleppey Backwaters to Fort Kochi Heritage",
        description: "Enjoy breakfast on the quiet morning waters before check-out. Drive to Fort Kochi. Stroll past the historic Chinese Fishing Nets, St. Francis Church, and colorful Jew Town antique alleys."
      },
      {
        day: 6,
        title: "Fort Kochi Departure",
        description: "Morning at leisure for local boutique shopping or an Ayurvedic relaxation massage. Private transfer to Kochi International Airport with memories of a lifetime."
      }
    ],
    seasonalPrices: [
      {
        label: "Peak, Oct-Mar",
        price: 32500,
        gstNote: "GST additional"
      },
      {
        label: "Monsoon, Jun-Sep",
        price: 24900,
        gstNote: "GST additional"
      }
    ],
    status: "published",
    coordinates: [76.3388, 9.4981]
  };

  await TravelPackage.findOneAndUpdate({ code: "PKG-KL-07" }, samplePkg1, { upsert: true, new: true });
  console.log("Upserted sample package PKG-KL-07 (Published, Peak: 32500, Monsoon: 24900).");

  const samplePkg2 = {
    code: "PKG-SI-12",
    title: "Madurai, Rameswaram and Kanyakumari",
    slug: "madurai-rameswaram-and-kanyakumari",
    subtitle: "Sacred Dravidian temples, the Pamban Sea Bridge and sunrise where three oceans meet",
    description: "A cultural and spiritual passage through Tamil Nadu's deeply evocative south. Marvel at the soaring gopurams of Meenakshi Temple, cross the engineering wonder of Pamban bridge to Rameswaram, and watch the sun rise across three merging oceans at Cape Comorin.",
    days: 5,
    nights: 4,
    hotelCategory: "3 star",
    image: {
      url: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=85",
      filename: "madurai-temple.jpg"
    },
    destinations: ["Madurai", "Rameswaram", "Kanyakumari"],
    inclusions: [
      "4 nights comfortable 3-star hotel accommodation with breakfast",
      "Private AC vehicle for all transfers, sightseeing, and intercity travel",
      "Special darshan assistance at Meenakshi Amman Temple",
      "Ferry tickets to Vivekananda Rock Memorial",
      "Driver batta, toll taxes, state permits and parking fees"
    ],
    itinerary: [
      {
        day: 1,
        title: "Arrive in Madurai · Meenakshi Amman Temple",
        description: "Welcome at Madurai airport/station. Check into hotel. Evening witness the unforgettable night palliyarai procession at the Meenakshi Temple."
      },
      {
        day: 2,
        title: "Madurai to Rameswaram via Pamban Bridge",
        description: "Drive across the turquoise Palk Strait over the iconic Pamban bridge. Check in and visit Ramanathaswamy Temple with its longest hall of carved corridors."
      },
      {
        day: 3,
        title: "Dhanushkodi Ghost Town & Ocean Drive to Kanyakumari",
        description: "Morning 4x4 safari to Dhanushkodi beach where Indian Ocean meets Bay of Bengal. Afternoon drive to Kanyakumari at India's southern tip."
      },
      {
        day: 4,
        title: "Kanyakumari · Vivekananda Rock Memorial & Triveni Sunset",
        description: "Ferry to Vivekananda Rock Memorial and Thiruvalluvar Statue. Visit Gandhi Memorial and witness the three-ocean sunset at Triveni Sangam."
      },
      {
        day: 5,
        title: "Triveni Sunrise & Departure via Trivandrum",
        description: "Catch the world-famous Kanyakumari ocean sunrise. Transfer to Trivandrum Airport (TRV) or Madurai for your return journey."
      }
    ],
    seasonalPrices: [
      {
        label: "All year",
        price: 18750,
        gstNote: "GST additional"
      }
    ],
    status: "draft",
    coordinates: [77.5385, 8.0883]
  };

  await TravelPackage.findOneAndUpdate({ code: "PKG-SI-12" }, samplePkg2, { upsert: true, new: true });
  console.log("Upserted sample package PKG-SI-12 (Draft, All year: 18750).");

  // 4. Seed / Upsert Blogs
  const blogsData = [
    {
      title: "The Ultimate Kerala Backwaters Guide: Houseboat Routes & Best Seasons",
      slug: "ultimate-kerala-backwaters-guide-houseboat-routes",
      excerpt: "Everything you need to know about navigating the tranquil canals of Alleppey and Kumarakom, choosing between deluxe and premium houseboats, and seasonal insider tips.",
      content: `The backwaters of Kerala are an enchanting labyrinth of rivers, lakes, lagoons, and emerald canals winding through tranquil palm groves and endless paddy fields.

### Choosing Your Route
The most celebrated route begins in **Alleppey (Alappuzha)**, gliding towards the sprawling **Vembanad Lake**, then anchoring in peaceful rural lagoons. For those seeking even quieter waters, embarking from **Kumarakom** offers bird sanctuary vistas and secluded shores.

### Deluxe vs. Premium Luxury Houseboats
A traditional *Kettuvallam* is hand-crafted with jackwood and thatched roofs, yet modern versions are fitted with air-conditioned glass suites, sun decks, and private kitchens. On a premium vessel, your private chef prepares traditional Karimeen Pollichathu (pearl spot fish baked in banana leaf) and warm appams as you cruise.

### Best Time to Cruise
- **Peak Season (October to March)**: Crisp blue skies, calm waters, and gentle breezes.
- **Monsoon (June to September)**: Known as the Green Season, when rains bring the backwaters alive with lush emerald beauty and romantic misty mornings.`,
      category: "Destination Guides",
      tags: ["Kerala", "Alleppey", "Houseboat", "Backwaters", "Slow Travel"],
      image: {
        url: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
        filename: "kerala-backwaters.jpg"
      },
      author: "Priya Nair",
      readTime: "6 min read",
      seoTitle: "Kerala Backwaters Guide: Houseboat Routes & Costs | Asteria Journeys",
      seoDescription: "Explore the best Kerala houseboat itineraries, routes from Alleppey to Kumarakom, seasonal prices, and local cuisine tips.",
      status: "published"
    },
    {
      title: "Munnar vs Wayanad: Which Kerala Hill Station is Right for You?",
      slug: "munnar-vs-wayanad-which-kerala-hill-station",
      excerpt: "Comparing South India's two most beloved mountain retreats: rolling manicured tea carpet valleys versus untamed rainforest sanctuaries and treehouse hideaways.",
      content: `Choosing between Munnar and Wayanad is one of the most common dilemmas for travellers planning a holiday to South India. Both offer cool mountain air and lush scenery, but their personalities are delightfully distinct.

### Munnar: The High-Altitude Tea Capital
Perched at 1,600 metres, Munnar is defined by endless manicured carpets of tea plantations cascading across the Western Ghats. It feels colonial, orderly, and grand.
- **Ideal for**: Couples, first-time visitors, photography lovers, and tea connoisseurs.
- **Top highlights**: Eravikulam National Park (Nilgiri Tahr), KDHP Tea Museum, and Mattupetty Lake.

### Wayanad: The Wild Rainforest & Adventure Haven
Wayanad is located in northern Kerala, bordering the Nilgiri Biosphere. Here, the landscape is wilder, dominated by dense rainforests, waterfalls, spice farms, and ancient caves.
- **Ideal for**: Adventure seekers, trekking enthusiasts, families wanting treehouse stays, and wildlife lovers.
- **Top highlights**: Edakkal Caves with prehistoric petroglyphs, Chembra Peak heart-shaped lake, and bamboo rafting.`,
      category: "Travel Tips",
      tags: ["Munnar", "Wayanad", "Hills", "Nature", "Itinerary"],
      image: {
        url: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80",
        filename: "munnar-hills.jpg"
      },
      author: "Arjun Menon",
      readTime: "5 min read",
      seoTitle: "Munnar vs Wayanad: Which Hill Station Should You Visit? | Asteria",
      seoDescription: "A practical guide comparing Munnar and Wayanad for climate, attractions, stays, and travel styles in Kerala.",
      status: "published"
    },
    {
      title: "Sacred South: Meenakshi Temple, Pamban Bridge and Cape Comorin",
      slug: "sacred-south-meenakshi-temple-pamban-bridge-cape-comorin",
      excerpt: "A profound cultural voyage across the southern tip of the subcontinent, touching ancient Dravidian architecture and the confluence of three oceans.",
      content: `The southern corridor of Tamil Nadu holds some of the world's most evocative sacred and coastal monuments.

### The Wonder of Madurai Meenakshi
Madurai is one of the oldest continuously inhabited cities on earth. At its beating heart stands Meenakshi Amman Temple, boasting 14 towering Gopurams painted in hundreds of mythological figures.

### Crossing the Pamban Sea Bridge to Rameswaram
The drive over the historic Pamban Bridge is legendary. On either side, the deep turquoise sea stretches to the horizon as you approach the island of Rameswaram and the mysterious sands of Dhanushkodi.

### Triveni Sangam at Kanyakumari
At Cape Comorin, the Indian Ocean, Arabian Sea, and Bay of Bengal merge together. Standing at the Vivekananda Rock Memorial during sunrise is a spiritual moment that stays with you forever.`,
      category: "Culture & Heritage",
      tags: ["Tamil Nadu", "Madurai", "Rameswaram", "Kanyakumari", "Heritage"],
      image: {
        url: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80",
        filename: "madurai-heritage.jpg"
      },
      author: "Lakshmi Swaminathan",
      readTime: "7 min read",
      seoTitle: "Madurai, Rameswaram & Kanyakumari Travel Itinerary | Asteria Journeys",
      seoDescription: "Guide to visiting Madurai Meenakshi Amman Temple, Pamban bridge, Dhanushkodi, and Kanyakumari Triveni Sangam.",
      status: "published"
    }
  ];

  await Blog.deleteMany({});
  const seededBlogs = await Blog.insertMany(blogsData);
  console.log(`Seeded ${seededBlogs.length} rich blog posts with SEO and categories.`);

  // 5. Seed Sample Enquiry from prompt specification:
  // "Hi, 2 adults and 1 kid, Kerala 5-6 nights in December, budget around 1.2 lakh total, houseboat a must"
  const kl07 = await TravelPackage.findOne({ code: "PKG-KL-07" });
  const sampleEnquiryData = {
    name: "Vikram & Ananya Sharma",
    email: "vikram.sharma@example.com",
    phone: "+91 98765 43210",
    source: "Website form",
    package: kl07 ? kl07._id : null,
    message: "Hi, 2 adults and 1 kid, Kerala 5-6 nights in December, budget around 1.2 lakh total, houseboat a must",
    travelDates: "18-24 December (Peak Season)",
    travellers: "2 Adults, 1 Child (7 yrs)",
    fareType: "Family Saver",
    promoCode: "MMTKERALA",
    whatsappConsent: true,
    status: "new",
    notes: "Priority high-value family enquiry. Requested private luxury houseboat for 1 night in Alleppey.",
    messages: [
      {
        direction: "inbound",
        text: "Hi, 2 adults and 1 kid, Kerala 5-6 nights in December, budget around 1.2 lakh total, houseboat a must",
        author: "Vikram & Ananya Sharma",
        createdAt: new Date(Date.now() - 35 * 60 * 1000)
      },
      {
        direction: "system",
        text: "Namaste Vikram & Ananya. We have received your enquiry for Kerala. A senior journey consultant will craft your custom itinerary within the hour.",
        createdAt: new Date(Date.now() - 34 * 60 * 1000)
      }
    ]
  };

  sampleEnquiryData.ai = await enrichEnquiry(sampleEnquiryData);
  await Enquiry.findOneAndUpdate(
    { email: "vikram.sharma@example.com" },
    sampleEnquiryData,
    { upsert: true, new: true }
  );
  console.log("Upserted sample enquiry matching specification: 'Hi, 2 adults and 1 kid, Kerala 5-6 nights in December...'");

  await mongoose.disconnect();
  console.log("Seeding complete and database disconnected safely.");
}

seedData().catch(err => {
  console.error("Seeding error:", err);
  process.exit(1);
});

