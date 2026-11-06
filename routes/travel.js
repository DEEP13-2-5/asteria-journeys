const router = require("express").Router();
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const { storage } = require("../cloudConfig");
const upload = multer({ storage });
const travel = require("../controllers/travel");
const { isLoggedIn, requireOwner, requireStaff, canAccessEnquiry } = require("../middleware");

const enquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many enquiries from this connection. Please try again later."
});

// Public Discovery & Bookings
router.get("/", travel.home);
router.get("/journeys", travel.packages);
router.get("/journeys/:slug", travel.showPackage);
router.post("/journeys/:id/enquiries", enquiryLimiter, travel.createEnquiry);

// Stays & Location Explorer
router.get("/explore", travel.explore);

// Custom Package Builder
router.get("/custom-package", travel.customPackage);
router.post("/custom-package", travel.createCustomPackage);

// AI Trip Planner & Generator
router.get("/ai-planner", travel.aiPlanner);
router.post("/api/ai/generate-package", travel.apiGenerateAIPackage);

// Blogs
router.get("/blogs", travel.blogs);
router.get("/blogs/:slug", travel.showBlog);

// Branded Quotes
router.get("/quotes/:id", travel.showQuote);
router.post("/quotes/:id/accept", travel.acceptQuote);

// SEO Sitemap
router.get("/sitemap.xml", travel.sitemap);

// Admin / Staff Workspace
router.get("/admin", isLoggedIn, (req, res) => res.redirect("/admin/enquiries"));

// Packages CMS
router.get("/admin/packages", requireOwner, travel.adminPackages);
router.get("/admin/packages/new", requireOwner, travel.newPackage);
router.post("/admin/packages", requireOwner, upload.single("image"), travel.createPackage);
router.get("/admin/packages/:id/edit", requireOwner, travel.editPackage);
router.put("/admin/packages/:id", requireOwner, upload.single("image"), travel.updatePackage);
router.post("/admin/packages/:id/duplicate", requireOwner, travel.duplicatePackage);

// Blogs CMS
router.get("/admin/blogs", requireOwner, travel.adminBlogs);
router.get("/admin/blogs/new", requireOwner, travel.newBlog);
router.post("/admin/blogs", requireOwner, upload.single("image"), travel.createBlog);
router.get("/admin/blogs/:id/edit", requireOwner, travel.editBlog);
router.put("/admin/blogs/:id", requireOwner, upload.single("image"), travel.updateBlog);
router.delete("/admin/blogs/:id", requireOwner, travel.deleteBlog);

// Quotes Builder & Management
router.get("/admin/quotes", requireStaff, travel.adminQuotes);
router.get("/admin/quotes/new", requireStaff, travel.newQuote);
router.post("/admin/quotes", requireStaff, travel.createQuote);

// Enquiries & Inbox
router.get("/admin", requireStaff, (req, res) => res.redirect("/admin/enquiries"));
router.get("/admin/enquiries", requireStaff, travel.adminEnquiries);
router.get("/admin/enquiries/:id", requireStaff, canAccessEnquiry, travel.enquiryDetail);
router.put("/admin/enquiries/:id", requireStaff, canAccessEnquiry, travel.updateEnquiry);
router.post("/admin/enquiries/:id/regenerate-ai", requireStaff, canAccessEnquiry, travel.regenerateAiEnquiry);

// Team Management
router.get("/admin/team", requireOwner, travel.team);

module.exports = router;
