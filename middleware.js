const Listing = require('./models/listing.js');
const Review = require('./models/review.js');
const { listingSchema } = require('./schema.js');
const ExpressError = require('./utils/ExpressError.js');
const { reviewSchema } = require('./schema.js');

//Middleware to check if user is logged in or not 
module.exports.isLoggedIn = (req, res, next) => {
    //passport has inbuild function will authenticate user if they are logged in or not. req.user variable will have all info about user
    // console.log(req.user);
    if (!req.isAuthenticated()) {
        //redirect url save
        req.session.redirectUrl = req.originalUrl;
        req.flash('error', 'Please sign in to access the Asteria staff workspace.');
        return res.redirect('/login');
    }
    next();
}

module.exports.requireRole = (...roles) => (req, res, next) => {
    if (!req.user || !req.user.active || !roles.includes(req.user.role)) {
        req.flash("error", "You do not have access to that workspace.");
        return res.redirect(req.user?.role === "customer" ? "/journeys" : "/login");
    }
    next();
};

module.exports.requireOwner = module.exports.requireRole("owner");
module.exports.requireStaff = module.exports.requireRole("owner", "consultant");

module.exports.canAccessEnquiry = async (req, res, next) => {
  const Enquiry = require("./models/enquiry");
  const enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) return res.status(404).render("Error.ejs", { message: "Enquiry not found" });
  const user = req.user;
  const allowed = user.role === "owner" || user.role === "consultant" ||
    (user.role === "customer" && enquiry.customer && enquiry.customer.equals(user._id));
  if (!allowed) return res.status(403).render("Error.ejs", { message: "You do not have permission to view this enquiry." });
  req.enquiry = enquiry;
  next();
};
//to save redirectUrl to locals
module.exports.saveRedirectUrl = (req, res, next) => {
    //when we login then passport clear session data. to get redirect url we need to store in locals
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
}

module.exports.isOwner = async (req, res, next) => {
    //authorization step
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing.owner._id.equals(res.locals.currUser._id)) {
        req.flash('error', "You are not owner of this listing")
        return res.redirect(`/listings/${id}`);
    }
    next();
}

module.exports.isReviewAuthor = async (req, res, next) => {
    let { id, reviewId } = req.params;
    let review = await Review.findById(reviewId);
    if (!review.author._id.equals(res.locals.currUser._id)) {
        req.flash('error', "You are not author of this review")
        return res.redirect(`/listings/${id}`);
    }
    next();
}


//MiddleWare to validate incomming data
//validate data for reviews
module.exports.validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
}

//validate data for listings
module.exports.validatelisting = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
}
