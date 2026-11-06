const TravelPackage = require("../models/package");
const Enquiry = require("../models/enquiry");
const Hotel = require("../models/hotel");
const Place = require("../models/place");
const Blog = require("../models/blog");
const Quote = require("../models/quote");
const User = require("../models/user");
const Invitation = require("../models/invitation");
const slugify = require("../utils/slug");
const { enrichEnquiry, generateAIPackage } = require("../services/ai");
const { offers, getOffers, findOfferByCode } = require("../services/offers");

const visible = (req) => req.query.preview === "1" && req.isAuthenticated() && req.user.role === "owner";

// 1. Home Page: MakeMyTrip style Top Header, Search Widget, Special Fares, Offers Carousel, Location Hotels & Places, Featured Packages
exports.home = async (req, res) => {
  const publishedPackages = await TravelPackage.find({ status: "published", deletedAt: null }).sort({ updatedAt: -1 }).limit(6);
  const allHotels = await Hotel.find().sort({ rating: -1 }).limit(16).lean();
  const allPlaces = await Place.find().limit(12).lean();
  const recentBlogs = await Blog.find({ status: "published" }).sort({ publishedAt: -1 }).limit(3).lean();
  
  // Distinct locations
  const locations = ["All Locations", "Munnar", "Alleppey", "Thekkady", "Kochi", "Wayanad", "Kovalam", "Madurai", "Kanyakumari"];

  res.render("travel/home", {
    packages: publishedPackages,
    offers: getOffers("all"),
    hotels: allHotels,
    places: allPlaces,
    locations,
    blogs: recentBlogs,
    selectedFare: req.query.fareType || "regular",
    query: req.query || {}
  });
};

// 2. Packages Listing with Search & Special Fare Calculations
exports.packages = async (req, res) => {
  const { q, destination, days, star, fareType } = req.query;
  const conditions = { deletedAt: null, ...(visible(req) ? {} : { status: "published" }) };

  if (q && q.trim()) {
    conditions.$text = { $search: q.trim() };
  }
  if (destination && destination !== "All") {
    conditions.destinations = { $in: [new RegExp(destination, "i")] };
  }
  if (star && star !== "All") {
    conditions.hotelCategory = new RegExp(star, "i");
  }
  if (days && days !== "All") {
    if (days === "short") conditions.days = { $lte: 4 };
    else if (days === "medium") conditions.days = { $gte: 5, $lte: 7 };
    else if (days === "long") conditions.days = { $gte: 8 };
  }

  const packages = await TravelPackage.find(conditions).sort({ updatedAt: -1 });

  res.render("travel/packages", {
    packages,
    query: q || "",
    destination: destination || "All",
    daysFilter: days || "All",
    starFilter: star || "All",
    fareType: fareType || "Regular",
    offers: getOffers("holidays")
  });
};

// 3. Location & Stays Explorer ("some hotels places come acc to location")
exports.explore = async (req, res) => {
  const selectedLocation = req.query.location || "Munnar";
  const locations = ["Munnar", "Alleppey", "Thekkady", "Kochi", "Wayanad", "Kovalam", "Madurai", "Kanyakumari"];

  const locRegex = selectedLocation === "All" ? /.*/ : new RegExp(selectedLocation, "i");
  const hotels = await Hotel.find({ location: locRegex }).sort({ rating: -1 });
  const places = await Place.find({ location: locRegex });
  const matchingPackages = await TravelPackage.find({
    status: "published",
    deletedAt: null,
    destinations: { $in: [locRegex] }
  }).limit(4);

  res.render("travel/explore", {
    locations,
    selectedLocation,
    hotels,
    places,
    packages: matchingPackages
  });
};

// 4. Custom Package Builder ("i can make custom package")
exports.customPackage = async (req, res) => {
  const allHotels = await Hotel.find().sort({ location: 1, pricePerNight: 1 }).lean();
  const allPlaces = await Place.find().lean();
  const locations = ["Munnar", "Alleppey", "Thekkady", "Kochi", "Wayanad", "Kovalam", "Madurai", "Kanyakumari"];
  const prefillCode = req.query.code || "";
  const initialOffer = findOfferByCode(prefillCode);

  res.render("travel/custom-package", {
    hotels: allHotels,
    places: allPlaces,
    locations,
    offers: getOffers("all"),
    initialCode: prefillCode,
    initialOffer
  });
};

// Process Custom Package Submission (Save Enquiry + Generate Quote)
exports.createCustomPackage = async (req, res) => {
  try {
    const {
      name, email, phone, destinations, days, nights, travellers,
      hotelCategory, selectedHotels, inclusions, fareType, promoCode,
      message, whatsappConsent, notes, basePrice, totalPrice
    } = req.body;

    const destList = Array.isArray(destinations) ? destinations : (destinations ? [destinations] : ["Kochi", "Munnar", "Alleppey"]);
    const hotelList = Array.isArray(selectedHotels) ? selectedHotels : (selectedHotels ? [selectedHotels] : []);
    const incList = Array.isArray(inclusions) ? inclusions : (inclusions ? [inclusions] : [
      "Accommodation on twin sharing basis",
      "Daily breakfast at all hotels",
      "Private AC Sedan/Innova transfer and sightseeing",
      "Driver batta, toll, fuel, and parking included"
    ]);

    const numDays = Math.max(2, Number(days) || 5);
    const numNights = Math.max(1, Number(nights) || (numDays - 1));
    const subtotal = Number(basePrice) || (numDays * 4800);
    const total = Number(totalPrice) || Math.round(subtotal * 1.05);
    const gstAmt = Math.round(subtotal * 0.05);

    // Create formal quote
    const quoteNum = `AST-QT-${Date.now().toString().slice(-6)}`;
    const quote = await Quote.create({
      quoteNumber: quoteNum,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      packageTitle: `Custom Private Tour: ${destList.join(" · ")}`,
      destinations: destList,
      days: numDays,
      nights: numNights,
      travellers: travellers || "2 Adults",
      hotelCategory: hotelCategory || "4 star",
      hotels: hotelList,
      inclusions: incList,
      itinerary: destList.map((d, i) => ({
        day: i + 1,
        title: `Day ${i + 1}: Discover ${d}`,
        description: `Private sightseeing and bespoke exploration in ${d} with handpicked stay.`
      })),
      basePricePerPerson: Math.round(subtotal / 2),
      fareType: fareType || "Regular",
      promoCode: promoCode || "",
      subtotal,
      gstPercent: 5,
      gstAmount: gstAmt,
      totalAmount: total,
      notes: notes || "Tailored custom package created via Asteria online builder.",
      status: "sent"
    });

    // Create enquiry in admin inbox
    const enquiryData = {
      name,
      email,
      phone,
      source: "Custom Package Builder",
      message: message || `Custom ${numDays}-day package requested for ${destList.join(", ")}. Hotel style: ${hotelCategory}.`,
      travelDates: req.body.travelDates || "Flexible / Upcoming",
      travellers: travellers || "2 Adults",
      fareType: fareType || "Regular",
      promoCode: promoCode || "",
      quote: quote._id,
      whatsappConsent: Boolean(whatsappConsent),
      customPackage: {
        quoteNumber: quoteNum,
        destinations: destList,
        days: numDays,
        nights: numNights,
        hotels: hotelList,
        hotelCategory,
        totalAmount: total,
        inclusions: incList
      }
    };

    enquiryData.ai = await enrichEnquiry(enquiryData);
    enquiryData.messages = [
      { direction: "inbound", text: enquiryData.message, author: name },
      { direction: "system", text: `Your custom package request has been generated (Quote #${quoteNum}). A dedicated journey designer in Kochi will review your selections within the hour.` }
    ];

    const enquiry = await Enquiry.create(enquiryData);
    quote.enquiryRef = enquiry._id;
    await quote.save();

    req.flash("success", `Your custom package enquiry was received! Quote #${quoteNum} is ready.`);
    res.redirect(`/quotes/${quote._id}`);
  } catch (err) {
    console.error("Custom package creation error:", err);
    req.flash("error", "Could not complete custom package. Please check the fields and try again.");
    res.redirect("/custom-package");
  }
};

// 5. Dedicated AI Trip Planner Page ("and AI too give package")
exports.aiPlanner = async (req, res) => {
  const publishedPackages = await TravelPackage.find({ status: "published", deletedAt: null }).limit(4);
  res.render("travel/ai-planner", {
    packages: publishedPackages,
    offers: getOffers("all")
  });
};

// AJAX API for live AI Package Generation
exports.apiGenerateAIPackage = async (req, res) => {
  try {
    const aiPlan = await generateAIPackage(req.body);
    res.json({ success: true, package: aiPlan });
  } catch (err) {
    console.error("AI package generation error:", err);
    res.status(500).json({ success: false, message: "AI Planner encountered an error. Generating fallback itinerary..." });
  }
};

// 6. Public Blogs & Detail
exports.blogs = async (req, res) => {
  const { category, q } = req.query;
  const conditions = { status: "published" };
  if (category && category !== "All") conditions.category = category;
  if (q && q.trim()) conditions.$text = { $search: q.trim() };

  const blogs = await Blog.find(conditions).sort({ publishedAt: -1 });
  const categories = ["All", "Destination Guides", "Travel Tips", "Culture & Heritage"];

  res.render("travel/blogs", {
    blogs,
    categories,
    selectedCategory: category || "All",
    query: q || ""
  });
};

exports.showBlog = async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug, status: "published" }).populate("relatedPackages");
  if (!blog) return res.status(404).render("Error.ejs", { message: "Article not found" });

  let relatedPackages = blog.relatedPackages || [];
  if (relatedPackages.length === 0) {
    relatedPackages = await TravelPackage.find({ status: "published", deletedAt: null }).limit(3);
  }

  res.render("travel/blog", { blog, relatedPackages });
};

// 7. Branded Quotes & Customer View
exports.showQuote = async (req, res) => {
  const quote = await Quote.findById(req.params.id);
  if (!quote) return res.status(404).render("Error.ejs", { message: "Quote not found or expired" });
  res.render("travel/quote", { quote });
};

exports.acceptQuote = async (req, res) => {
  const quote = await Quote.findById(req.params.id);
  if (!quote) return res.status(404).render("Error.ejs", { message: "Quote not found" });
  quote.status = "accepted";
  await quote.save();

  if (quote.enquiryRef) {
    await Enquiry.findByIdAndUpdate(quote.enquiryRef, {
      status: "quoted",
      $push: {
        messages: {
          direction: "inbound",
          text: `Customer accepted Quote #${quote.quoteNumber}. Ready for confirmation!`,
          author: quote.customerName
        }
      }
    });
  }

  req.flash("success", `Thank you! Quote #${quote.quoteNumber} has been accepted. Our Kochi office has been notified.`);
  res.redirect(`/quotes/${quote._id}`);
};

// 8. Sitemap
exports.sitemap = async (req, res) => {
  const packages = await TravelPackage.find({ status: "published" }).select("slug updatedAt").lean();
  const blogs = await Blog.find({ status: "published" }).select("slug updatedAt").lean();
  const base = `${req.protocol}://${req.get("host")}`;
  const staticUrls = ["/", "/journeys", "/explore", "/custom-package", "/ai-planner", "/blogs"];
  const pkgUrls = packages.map(pkg => `/journeys/${pkg.slug}`);
  const blogUrls = blogs.map(b => `/blogs/${b.slug}`);
  const allUrls = [...staticUrls, ...pkgUrls, ...blogUrls];

  res.type("application/xml").send(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${allUrls.map(url => `<url><loc>${base}${url}</loc><lastmod>${new Date().toISOString().split("T")[0]}</lastmod></url>`).join("")}</urlset>`
  );
};

// 9. Public Package Detail & Enquiry Creation
exports.showPackage = async (req, res) => {
  const pkg = await TravelPackage.findOne({ slug: req.params.slug });
  if (!pkg || pkg.deletedAt || (pkg.status !== "published" && !visible(req))) {
    return res.status(404).render("Error.ejs", { message: "Journey not found" });
  }

  // Get hotels & places matching this package's destinations
  const hotels = await Hotel.find({
    location: { $in: pkg.destinations.map(d => new RegExp(d.trim(), "i")) }
  }).limit(6);

  const places = await Place.find({
    location: { $in: pkg.destinations.map(d => new RegExp(d.trim(), "i")) }
  }).limit(4);

  res.render("travel/package", { pkg, hotels, places, offers: getOffers("holidays") });
};

exports.createEnquiry = async (req, res) => {
  const pkg = await TravelPackage.findById(req.params.id);
  if (!pkg) return res.status(404).render("Error.ejs", { message: "Journey not found" });

  const data = {
    ...req.body,
    package: pkg._id,
    source: "Website form",
    fareType: req.body.fareType || "Regular",
    promoCode: req.body.promoCode || "",
    whatsappConsent: Boolean(req.body.whatsappConsent),
    customer: req.user?.role === "customer" ? req.user._id : null
  };

  data.ai = await enrichEnquiry(data);
  data.messages = [
    { direction: "inbound", text: data.message, author: data.name },
    { direction: "system", text: "Thank you for reaching out to Asteria Journeys. We have received your enquiry and an itinerary specialist in Kochi will reply within the hour." },
  ];

  await Enquiry.create(data);
  req.flash("success", "Your enquiry has been received! A journey consultant will reply within the hour.");
  res.redirect(`/journeys/${pkg.slug}`);
};

// 10. Admin Packages CMS
exports.adminPackages = async (req, res) => {
  res.render("admin/packages", {
    packages: await TravelPackage.find({ deletedAt: null }).sort({ updatedAt: -1 })
  });
};

exports.newPackage = (req, res) => res.render("admin/package-form", { pkg: null });

exports.createPackage = async (req, res) => {
  const pkg = packageFromBody(req);
  pkg.code = req.body.code || `PKG-${Date.now().toString().slice(-6)}`;
  pkg.slug = await uniqueSlug(req.body.title);
  pkg.updatedBy = req.user.username;
  pkg.createdBy = req.user._id;
  if (req.file) pkg.image = { url: req.file.path, filename: req.file.filename };
  else if (req.body.imageUrl) pkg.image = { url: req.body.imageUrl, filename: "web-image" };
  await TravelPackage.create(pkg);
  req.flash("success", "Journey created as a draft.");
  res.redirect("/admin/packages");
};

exports.editPackage = async (req, res) => {
  const pkg = await TravelPackage.findById(req.params.id);
  if (!pkg) return res.redirect("/admin/packages");
  res.render("admin/package-form", { pkg });
};

exports.updatePackage = async (req, res) => {
  const old = await TravelPackage.findById(req.params.id);
  if (!old) return res.redirect("/admin/packages");
  const update = packageFromBody(req);
  if (req.body.title !== old.title) update.slug = await uniqueSlug(req.body.title, old._id);
  update.updatedBy = req.user.username;
  if (req.file) update.image = { url: req.file.path, filename: req.file.filename };
  else if (req.body.imageUrl) update.image = { url: req.body.imageUrl, filename: "web-image" };

  const snapshot = old.toObject();
  delete snapshot.versions;
  old.versions.unshift({
    version: old.versions.length + 1,
    savedBy: req.user.username,
    note: req.body.action === "publish" ? "Published update" : "Saved draft",
    snapshot
  });

  Object.assign(old, update);
  if (old.status === "published" && req.body.action !== "publish") old.status = "draft";
  if (req.body.action === "publish") old.status = "published";
  await old.save();

  req.flash("success", req.body.action === "publish" ? "Journey published." : "Draft saved.");
  res.redirect(`/admin/packages/${old._id}/edit`);
};

exports.duplicatePackage = async (req, res) => {
  const source = await TravelPackage.findById(req.params.id).lean();
  if (!source) return res.redirect("/admin/packages");
  delete source._id; delete source.createdAt; delete source.updatedAt; delete source.__v;
  source.code = `${source.code}-COPY`;
  source.title = `${source.title} (copy)`;
  source.slug = await uniqueSlug(source.title);
  source.status = "draft";
  source.versions = [];
  const copy = await TravelPackage.create(source);
  res.redirect(`/admin/packages/${copy._id}/edit`);
};

// 11. Admin Enquiries Inbox
exports.adminEnquiries = async (req, res) => {
  res.render("admin/enquiries", {
    enquiries: await Enquiry.find().populate("package").sort({ createdAt: -1 })
  });
};

exports.enquiryDetail = async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id)
    .populate("package")
    .populate("ai.suggestions")
    .populate("quote");
  if (!enquiry) return res.redirect("/admin/enquiries");
  res.render("admin/enquiry-detail", { enquiry });
};

exports.updateEnquiry = async (req, res) => {
  const enquiry = req.enquiry || await Enquiry.findById(req.params.id);
  if (!enquiry) return res.redirect("/admin/enquiries");

  if (req.body.reply?.trim()) {
    enquiry.messages.push({
      direction: "outbound",
      text: req.body.reply.trim(),
      author: req.user.username
    });
  }
  enquiry.status = req.body.status || enquiry.status;
  if ((req.user.role === "owner" || req.user.role === "consultant") && req.body.assignedTo) enquiry.assignedTo = req.body.assignedTo;
  if (req.user.role !== "customer" && typeof req.body.notes === "string") enquiry.notes = req.body.notes;
  if (req.body.acceptAi) enquiry.ai.acceptedAt = new Date();

  await enquiry.save();
  req.flash("success", "Enquiry updated.");
  res.redirect(`/admin/enquiries/${enquiry._id}`);
};

exports.regenerateAiEnquiry = async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) return res.redirect("/admin/enquiries");

  const aiResult = await enrichEnquiry({
    message: enquiry.message,
    travelDates: enquiry.ai?.dates,
    travellers: enquiry.ai?.travellers,
    fareType: enquiry.fareType,
    promoCode: enquiry.promoCode
  });

  enquiry.ai = aiResult;
  await enquiry.save();

  req.flash("success", "AI draft reply and suggestions regenerated with live AI!");
  res.redirect(`/admin/enquiries/${enquiry._id}`);
};

// 12. Admin Blog CMS
exports.adminBlogs = async (req, res) => {
  const blogs = await Blog.find().sort({ publishedAt: -1 });
  res.render("admin/blogs", { blogs });
};

exports.newBlog = async (req, res) => {
  const packages = await TravelPackage.find({ status: "published" }).select("title _id code").lean();
  res.render("admin/blog-form", { blog: null, packages });
};

exports.createBlog = async (req, res) => {
  try {
    const slug = await uniqueBlogSlug(req.body.title);
    const related = req.body.relatedPackages ? (Array.isArray(req.body.relatedPackages) ? req.body.relatedPackages : [req.body.relatedPackages]) : [];
    const blogData = {
      title: req.body.title,
      slug,
      excerpt: req.body.excerpt,
      content: req.body.content,
      category: req.body.category || "Travel Guide",
      author: req.body.author || req.user.username,
      readTime: req.body.readTime || "5 min read",
      tags: String(req.body.tags || "").split(",").map(t => t.trim()).filter(Boolean),
      seoTitle: req.body.seoTitle || req.body.title,
      seoDescription: req.body.seoDescription || req.body.excerpt,
      relatedPackages: related,
      status: req.body.status || "published"
    };

    if (req.file) blogData.image = { url: req.file.path, filename: req.file.filename };
    else if (req.body.imageUrl) blogData.image = { url: req.body.imageUrl, filename: "web-image" };
    else blogData.image = { url: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80", filename: "default" };

    await Blog.create(blogData);
    req.flash("success", "Blog post published successfully.");
    res.redirect("/admin/blogs");
  } catch (err) {
    console.error("Create blog error:", err);
    req.flash("error", "Failed to create blog post.");
    res.redirect("/admin/blogs/new");
  }
};

exports.editBlog = async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.redirect("/admin/blogs");
  const packages = await TravelPackage.find({ status: "published" }).select("title _id code").lean();
  res.render("admin/blog-form", { blog, packages });
};

exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.redirect("/admin/blogs");

    if (req.body.title !== blog.title) {
      blog.slug = await uniqueBlogSlug(req.body.title, blog._id);
    }
    blog.title = req.body.title;
    blog.excerpt = req.body.excerpt;
    blog.content = req.body.content;
    blog.category = req.body.category;
    blog.author = req.body.author || blog.author;
    blog.readTime = req.body.readTime || blog.readTime;
    blog.tags = String(req.body.tags || "").split(",").map(t => t.trim()).filter(Boolean);
    blog.seoTitle = req.body.seoTitle;
    blog.seoDescription = req.body.seoDescription;
    blog.status = req.body.status || blog.status;
    blog.relatedPackages = req.body.relatedPackages ? (Array.isArray(req.body.relatedPackages) ? req.body.relatedPackages : [req.body.relatedPackages]) : [];

    if (req.file) blog.image = { url: req.file.path, filename: req.file.filename };
    else if (req.body.imageUrl) blog.image = { url: req.body.imageUrl, filename: "web-image" };

    await blog.save();
    req.flash("success", "Blog post updated.");
    res.redirect("/admin/blogs");
  } catch (err) {
    console.error("Update blog error:", err);
    req.flash("error", "Failed to update blog.");
    res.redirect(`/admin/blogs/${req.params.id}/edit`);
  }
};

exports.deleteBlog = async (req, res) => {
  await Blog.findByIdAndDelete(req.params.id);
  req.flash("success", "Blog post deleted.");
  res.redirect("/admin/blogs");
};

// 13. Admin Quotes CMS
exports.adminQuotes = async (req, res) => {
  const quotes = await Quote.find().sort({ createdAt: -1 });
  res.render("admin/quotes", { quotes });
};

exports.newQuote = async (req, res) => {
  const packages = await TravelPackage.find({ status: "published" }).select("title code seasonalPrices days destinations inclusions").lean();
  const enquiryId = req.query.enquiryId;
  let enquiry = null;
  if (enquiryId) enquiry = await Enquiry.findById(enquiryId);
  res.render("admin/quote-form", { packages, enquiry });
};

exports.createQuote = async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, packageId, days, travellers, basePrice, fareType, promoCode, promoDiscount, notes, enquiryId } = req.body;
    const pkg = packageId ? await TravelPackage.findById(packageId) : null;
    const quoteNum = `AST-QT-${Date.now().toString().slice(-6)}`;
    const base = Number(basePrice) || (pkg?.seasonalPrices[0]?.price || 25000);
    const pDiscount = Number(promoDiscount) || 0;
    const fareDiscount = fareType === "Armed Forces" || fareType === "Senior Citizen" ? 600 : 0;
    const subtotal = Math.max(1000, base - pDiscount - fareDiscount);
    const gstAmount = Math.round(subtotal * 0.05);
    const totalAmount = subtotal + gstAmount;

    const quote = await Quote.create({
      quoteNumber: quoteNum,
      customerName,
      customerEmail,
      customerPhone,
      packageTitle: pkg ? pkg.title : (req.body.packageTitle || "Custom Kerala Journey"),
      packageCode: pkg?.code || "CUSTOM",
      packageRef: pkg?._id || null,
      enquiryRef: enquiryId || null,
      destinations: pkg?.destinations || ["Kochi", "Munnar", "Alleppey"],
      days: Number(days) || (pkg?.days || 5),
      nights: Math.max(1, (Number(days) || (pkg?.days || 5)) - 1),
      travellers: travellers || "2 Adults",
      hotelCategory: pkg?.hotelCategory || "4 star",
      inclusions: pkg?.inclusions || ["Accommodation", "Private cab", "Breakfast"],
      itinerary: pkg?.itinerary || [{ day: 1, title: "Arrival", description: "Welcome to Kerala" }],
      basePricePerPerson: base,
      fareType: fareType || "Regular",
      promoCode: promoCode || "",
      promoDiscount: pDiscount,
      specialDiscount: fareDiscount,
      subtotal,
      gstPercent: 5,
      gstAmount,
      totalAmount,
      notes,
      status: "sent",
      createdBy: req.user._id
    });

    if (enquiryId) {
      await Enquiry.findByIdAndUpdate(enquiryId, {
        quote: quote._id,
        status: "quoted",
        $push: {
          messages: {
            direction: "outbound",
            text: `Branded Quote #${quoteNum} was generated for ₹${totalAmount.toLocaleString("en-IN")} and sent to traveller.`,
            author: req.user.username
          }
        }
      });
    }

    req.flash("success", `Quote #${quoteNum} generated successfully.`);
    res.redirect(`/quotes/${quote._id}`);
  } catch (err) {
    console.error("Create quote error:", err);
    req.flash("error", "Failed to generate quote.");
    res.redirect("/admin/quotes");
  }
};

// 14. Admin Team
exports.team = async (req, res) => {
  res.render("admin/team", {
    staff: await User.find({ role: { $in: ["owner", "consultant"] } }).select("username email role active"),
    invitations: await Invitation.find({ acceptedAt: null }).sort({ createdAt: -1 }).limit(10)
  });
};

// Helpers
function list(value) {
  return String(value || "").split("\n").map(v => v.trim()).filter(Boolean);
}

function packageFromBody(req) {
  const labels = Array.isArray(req.body.seasonLabel) ? req.body.seasonLabel : [req.body.seasonLabel];
  const amounts = Array.isArray(req.body.seasonPrice) ? req.body.seasonPrice : [req.body.seasonPrice];
  const prices = labels
    .map((label, i) => ({ label, price: Number(amounts[i]), gstNote: "GST additional" }))
    .filter(row => row.label && row.price);

  return {
    title: req.body.title,
    subtitle: req.body.subtitle,
    description: req.body.description,
    days: Number(req.body.days),
    nights: Math.max(0, Number(req.body.days) - 1),
    hotelCategory: req.body.hotelCategory,
    destinations: list(req.body.destinations),
    inclusions: list(req.body.inclusions),
    itinerary: list(req.body.itinerary).map((line, i) => ({ day: i + 1, title: `Day ${i + 1}`, description: line })),
    seasonalPrices: prices,
    coordinates: [Number(req.body.longitude) || 76.2673, Number(req.body.latitude) || 9.9312]
  };
}

async function uniqueSlug(title, id) {
  let slug = slugify(title), candidate = slug, n = 2;
  while (await TravelPackage.exists({ slug: candidate, ...(id ? { _id: { $ne: id } } : {}) })) {
    candidate = `${slug}-${n++}`;
  }
  return candidate;
}

async function uniqueBlogSlug(title, id) {
  let slug = slugify(title), candidate = slug, n = 2;
  while (await Blog.exists({ slug: candidate, ...(id ? { _id: { $ne: id } } : {}) })) {
    candidate = `${slug}-${n++}`;
  }
  return candidate;
}
