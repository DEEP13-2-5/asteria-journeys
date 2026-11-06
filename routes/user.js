const express = require('express');
const router = express.Router({ mergeParams: true });
const wrapAsync = require('../utils/wrapAsync');
const passport = require('passport');
const rateLimit = require("express-rate-limit");
const { saveRedirectUrl } = require("../middleware.js")
const userController = require('../controllers/users.js')
const { requireOwner } = require("../middleware.js");
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false, message: "Too many attempts. Please try again later." });

//Signup routes
router.route('/signup')
    .get((req, res) => {
        res.render("./user/signup.ejs");
    })
    .post(authLimiter, wrapAsync(userController.signup));

router.get('/invite/:token', wrapAsync(userController.acceptInviteForm));
router.post('/invite/:token', wrapAsync(userController.acceptInvite));
router.post('/admin/team/invitations', requireOwner, wrapAsync(userController.createInvitation));

//Login routes
router.route('/login')
    .get((req, res) => {
        res.render("./user/login.ejs");
    })
    .post(authLimiter,
        saveRedirectUrl,
        passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
        wrapAsync(userController.login)
    );


//LogOut routes
//Passport has inbuild function for logout
router.get('/logout', userController.logout);

module.exports = router;
