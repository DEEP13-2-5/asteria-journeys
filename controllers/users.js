const User = require('../models/user.js');
const Invitation = require('../models/invitation.js');
const crypto = require("crypto");

const tokenHash = (token) => crypto.createHash("sha256").update(token).digest("hex");

// Signup handler
module.exports.signup = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password || password.length < 8) throw new Error("Use a name, email and a password of at least 8 characters.");
        
        // Staff registration: only owner or consultant
        const role = ["owner", "consultant"].includes(req.body.role) ? req.body.role : "consultant";
        const newUser = new User({ email, username, role });
        const registerUser = await User.register(newUser, password);
        
        req.login(registerUser, (err) => {
            if (err) {
                return next(err); // Pass the error to the next middleware
            }
            req.flash("success", `Welcome to Asteria workspace, ${username} (${role.toUpperCase()}).`);
            return res.redirect("/admin/enquiries");
        });
    } catch (e) {
        req.flash("error", e.message); // Flash error message
        res.redirect('/signup');
    }
}

module.exports.createInvitation = async (req, res) => {
  const recipientName = String(req.body.recipientName || "").trim();
  if (recipientName.length < 2) { req.flash("error", "Enter the consultant's name."); return res.redirect("/admin/team"); }
  const rawToken = crypto.randomBytes(32).toString("hex");
  await Invitation.create({ recipientName, tokenHash: tokenHash(rawToken), invitedBy: req.user._id, expiresAt: new Date(Date.now() + 7 * 86400000) });
  req.flash("success", `App invitation created. Open link on consultant device: ${req.protocol}://${req.get("host")}/invite/${rawToken}`);
  res.redirect("/admin/team");
};
module.exports.acceptInviteForm = async (req, res) => {
  const invitation = await Invitation.findOne({ tokenHash: tokenHash(req.params.token), acceptedAt: null, expiresAt: { $gt: new Date() } });
  if (!invitation) return res.status(404).render("Error.ejs", { message: "This invitation is invalid or expired." });
  res.render("user/accept-invite", { token: req.params.token, recipientName: invitation.recipientName });
};
module.exports.acceptInvite = async (req, res, next) => {
  const invitation = await Invitation.findOne({ tokenHash: tokenHash(req.params.token), acceptedAt: null, expiresAt: { $gt: new Date() } });
  if (!invitation) return res.status(404).render("Error.ejs", { message: "This invitation is invalid or expired." });
  const { username, email, password } = req.body;
  if (!username || !email || !password || password.length < 8) { req.flash("error", "Use a name, email and password of at least 8 characters."); return res.redirect(`/invite/${req.params.token}`); }
  const user = await User.register(new User({ username, email, role: "consultant", invitedBy: invitation.invitedBy }), password);
  invitation.acceptedAt = new Date(); await invitation.save();
  req.login(user, (error) => error ? next(error) : res.redirect("/admin/enquiries"));
};

// Login handler
module.exports.login = async (req, res) => {
    req.flash("success", "Welcome back to Asteria.");
    
    // Use a safe fallback for redirectUrl in case it's not set
    let redirectUrl = req.session.redirectUrl || (req.user.role === "customer" ? "/journeys" : "/admin/enquiries");
    
    // Avoid redirecting to a DELETE action or invalid path
    if (redirectUrl.includes("DELETE") || redirectUrl === "/admin") {
        redirectUrl = req.user.role === "customer" ? "/journeys" : "/admin/enquiries";
    }

    res.redirect(redirectUrl);
}

// Logout handler
module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err); // Pass the error to the next middleware
        }
        req.flash("success", "You have been signed out.");
        res.redirect("/");
    });
}
