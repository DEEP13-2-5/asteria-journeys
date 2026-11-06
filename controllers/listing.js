const Listing = require("../models/listing.js");
const { listingSchema } = require("../schema");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN || process.env.MAPBOX_TOKEN;
const geocodingClient = mapToken ? mbxGeocoding({ accessToken: mapToken }) : null;

// Render all listings
module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
};

// Render form to create a new listing
module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

// Search for listings based on a query string
module.exports.searchResult = async (req, res) => {
    let { q } = req.query;
    if (!q) {
        return res.redirect("/listings");
    }

    const results = await Listing.find({
        $or: [
            { location: { $regex: q, $options: "i" } },
            { country: { $regex: q, $options: "i" } },
            { title: { $regex: q, $options: "i" } }
        ]
    });

    if (results.length === 0) {
        req.flash("error", `No listing exists for '${q}'`);
        return res.redirect("/listings");
    }

    res.render("listings/search.ejs", { results, query: q });
};

// Show a specific listing
module.exports.showListings = async (req, res, next) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: { path: "author" }
        })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing does not exist");
        return res.redirect("/listings");
    }

    res.render("listings/show.ejs", { listing });
};

// Render form to edit an existing listing
module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate("reviews")
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing does not exist");
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url.replace("/upload", "/upload/h_300,w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

// Create a new listing
module.exports.createListing = async (req, res) => {
    try {
        if (!req.body.listing || !req.body.listing.location) {
            req.flash("error", "Location is required");
            return res.redirect('back');
        }

        let geometry = {
            type: "Point",
            coordinates: [77.209, 28.6139],
        };

        if (geocodingClient) {
            let response = await geocodingClient.forwardGeocode({
                query: req.body.listing.location,
                limit: 1,
            }).send();

            if (response.body.features.length) {
                geometry = response.body.features[0].geometry;
            } else {
                req.flash("error", "Location not found");
                return res.redirect('back');
            }
        } else {
            req.flash("error", "Map token missing. Listing saved with default map location.");
        }

        // Check for file upload and categories
        if (!req.file) {
            req.flash("error", "Image is required");
            return res.redirect('back');
        }

        const { path: url, filename } = req.file;
        const newListing = new Listing(req.body.listing);
        newListing.owner = req.user._id;
        newListing.image = { url, filename };
        newListing.geometry = geometry;

        await newListing.save();
        req.flash("success", "New listing Created");
        res.redirect('/listings');
    } catch (err) {
        console.error(err);
        req.flash("error", "Something went wrong, please try again.");
        res.redirect('back');
    }
};

// Update an existing listing
module.exports.updateListings = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    // Handle image update
    if (req.file) {
        const { path: url, filename } = req.file;
        listing.image = { url, filename };
    }

    await listing.save();
    req.flash("success", "Listing updated successfully");
    res.redirect(`/listings/${id}`);
};

// Delete a listing
module.exports.destroyListings = async (req, res) => {
    let { id } = req.params;
    const deletedListing = await Listing.findByIdAndDelete(id);

    if (!deletedListing) {
        req.flash("error", "Listing does not exist");
        return res.redirect("/listings");
    }

    req.flash("success", "Listing deleted successfully");
    res.redirect("/listings");
};
module.exports.catagory = async (req, res) => {
        const normalizedCategory = req.params.category.replace(/-/g, " ");
        let allListings = await Listing.find({
            $or: [
                { category: req.params.category },
                { category: normalizedCategory },
            ],
        });
    allListings.forEach((category) => {
      category.formattedPrice = category.price.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
      });
    });
    res.render("listings/index.ejs", { allListings });
};
