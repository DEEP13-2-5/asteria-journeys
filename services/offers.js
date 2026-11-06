const offers = [
  {
    id: "off-1",
    category: "holidays",
    categoryLabel: "DOMESTIC HOLIDAYS",
    title: "Grab Up to 15% OFF* on Kerala Holiday Packages",
    subtitle: "Experience Munnar tea hills, Thekkady wildlife & Alleppey backwaters at festive prices",
    code: "MMTKERALA",
    discountType: "percent",
    discountValue: 15,
    maxDiscount: 5000,
    minSpend: 25000,
    validTill: "31 Dec 2026",
    badge: "FESTIVE SALE",
    image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=700&q=80",
    tc: "Applicable on all published and custom holiday packages. Maximum discount ₹5,000. Twin sharing basis. 5% GST additional."
  },
  {
    id: "off-2",
    category: "holidays",
    categoryLabel: "HOUSEBOAT EXCLUSIVE",
    title: "Flat ₹3,000 OFF on Alleppey Luxury Houseboat Stays",
    subtitle: "Book your private 1-night backwater cruise with authentic Kerala cuisine and chef",
    code: "HOUSEBOAT3K",
    discountType: "flat",
    discountValue: 3000,
    maxDiscount: 3000,
    minSpend: 20000,
    validTill: "30 Nov 2026",
    badge: "TOP PICK",
    image: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=700&q=80",
    tc: "Valid on all packages containing Alleppey or Kumarakom houseboat stays. Subject to vessel availability."
  },
  {
    id: "off-3",
    category: "bank",
    categoryLabel: "BANK OFFERS",
    title: "ICICI Bank: Instant ₹2,500 OFF on Tour Packages & Hotels",
    subtitle: "Pay via ICICI Credit or Debit card on any South India package above ₹25,000",
    code: "ICICITRAVEL",
    discountType: "flat",
    discountValue: 2500,
    maxDiscount: 2500,
    minSpend: 25000,
    validTill: "15 Jan 2027",
    badge: "INSTANT SAVINGS",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=700&q=80",
    tc: "Offer valid on ICICI Bank Credit/Debit cards once per card per month. Non-stackable with other bank cards."
  },
  {
    id: "off-4",
    category: "hotels",
    categoryLabel: "LUXURY HOTELS",
    title: "Up to 25% OFF on Luxury Tea Valley Resorts in Munnar",
    subtitle: "Complimentary plantation nature walk & high tea included with 4-star and 5-star stays",
    code: "HILLSTAY25",
    discountType: "percent",
    discountValue: 25,
    maxDiscount: 4000,
    minSpend: 15000,
    validTill: "31 Dec 2026",
    badge: "LIMITED PERIOD",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=700&q=80",
    tc: "Applicable on verified boutique resorts in Munnar, Wayanad and Coorg. Valid for stays up to 31 March 2027."
  },
  {
    id: "off-5",
    category: "holidays",
    categoryLabel: "TEMPLE HERITAGE",
    title: "Early Bird 2026: Save ₹4,500 on South India Temple Circuit",
    subtitle: "Madurai Meenakshi, Rameswaram Pamban & Kanyakumari 5-day cultural tours",
    code: "SOUTHINDIA",
    discountType: "flat",
    discountValue: 4500,
    maxDiscount: 4500,
    minSpend: 30000,
    validTill: "28 Feb 2027",
    badge: "EARLY BIRD",
    image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=700&q=80",
    tc: "Valid for bookings made at least 15 days prior to departure. Includes VIP darshan assistance."
  },
  {
    id: "off-6",
    category: "bank",
    categoryLabel: "BANK OFFERS",
    title: "HDFC Festive Treat: Flat 10% Instant Savings up to ₹3,500",
    subtitle: "Valid on all domestic South India holiday packages and luxury homestay retreats",
    code: "HDFCHOLIDAY",
    discountType: "percent",
    discountValue: 10,
    maxDiscount: 3500,
    minSpend: 20000,
    validTill: "31 Dec 2026",
    badge: "HDFC SPECIAL",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=700&q=80",
    tc: "Requires full or advance payment with HDFC cards. Can be combined with Special Fares."
  },
  {
    id: "off-7",
    category: "trains",
    categoryLabel: "TRAIN TOURS",
    title: "Special Deal on Vande Bharat & Trains for Heritage Tours",
    subtitle: "Up to ₹1,000 OFF on Kerala & Tamil Nadu rail-connected holiday packages",
    code: "RAILHOLIDAY",
    discountType: "flat",
    discountValue: 1000,
    maxDiscount: 1000,
    minSpend: 15000,
    validTill: "31 Jan 2027",
    badge: "TRAIN CONNECT",
    image: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=700&q=80",
    tc: "Covers seamless station transfers with private AC cab from Kochi, Trivandrum, Madurai and Calicut stations."
  },
  {
    id: "off-8",
    category: "cabs",
    categoryLabel: "TRANSFERS & CABS",
    title: "Free Airport Pickup & Sightseeing Cab Upgrade",
    subtitle: "Book any 5+ night Kerala package and get free upgrade to AC Toyota Innova Crysta",
    code: "FREECAB",
    discountType: "flat",
    discountValue: 2000,
    maxDiscount: 2000,
    minSpend: 35000,
    validTill: "31 Dec 2026",
    badge: "FREE UPGRADE",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=700&q=80",
    tc: "Complimentary vehicle upgrade subject to vehicle fleet schedule. Valid on Kochi and Trivandrum arrival routes."
  },
  {
    id: "off-9",
    category: "flights",
    categoryLabel: "FLIGHT PACKAGES",
    title: "Flat 12% OFF on Flight + Hotel + Kerala Tour Combos",
    subtitle: "Direct flight connections from Delhi, Mumbai, Bengaluru with airport assistance",
    code: "MMTDIWALI",
    discountType: "percent",
    discountValue: 12,
    maxDiscount: 4000,
    minSpend: 30000,
    validTill: "31 Dec 2026",
    badge: "FLIGHT + TOUR",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=700&q=80",
    tc: "Applies towards the land tour package when providing flight PNR details to your Asteria consultant."
  }
];

function getOffers(category = "all") {
  if (!category || category === "all") return offers;
  return offers.filter(o => o.category === category.toLowerCase());
}

function findOfferByCode(code) {
  if (!code) return null;
  return offers.find(o => o.code.toUpperCase() === code.trim().toUpperCase()) || null;
}

module.exports = { offers, getOffers, findOfferByCode };

