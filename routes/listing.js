const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn} = require("../middleware.js");
const {isOwner, validatelisting} =require("../middleware.js");
const multer = require('multer');
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });
const listingController = require("../controllers/listing.js");

router.route("/")
    .get(wrapAsync(listingController.index))
    .post(
      isLoggedIn,
        upload.single("listing[image]"),
        validatelisting,
        wrapAsync(listingController.createListing)
    );

// New Route
router.get("/new", isLoggedIn, listingController.renderNewForm);

// SEARCH route
router.get("/search",wrapAsync(listingController.searchResult));

router.get("/category/:category", listingController.catagory);
// router.post("/search/desti", listingController.searchListing);
// Listing All post || index route
// Create route
router.route("/:id")
    .get(wrapAsync(listingController.showListings))
    .put(
        isLoggedIn,
        isOwner,
        upload.single("listing[image]"),
        validatelisting,
        wrapAsync(listingController.updateListings)
    )
    .delete(
        isLoggedIn,
        isOwner,
        wrapAsync(listingController.destroyListings)
    );

// Edit Route
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

module.exports = router; 
