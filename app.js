const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const crypto = require("crypto");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const travelRouter = require("./routes/travel.js");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const MONGO_URL =
  process.env.ATLASTDB_URL ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URL ||
  "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
  await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.engine("ejs", ejsMate);
app.set("views", path.join(__dirname, "views"));
if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

const sessionOptions = {
  secret: process.env.SESSION_SECRET || process.env.SECRET || (process.env.NODE_ENV === "production" ? undefined : "local-development-only-secret"),
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
};

app.use(session(sessionOptions));
app.use((req, res, next) => {
  if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  res.locals.csrfToken = req.session.csrfToken;
  const stateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
  if (stateChanging && req.session.passport?.user && !req.body?._csrf) {
    return res.status(403).render("Error.ejs", { message: "Your form expired. Please refresh and try again." });
  }
  if (stateChanging && req.body?._csrf) {
    const supplied = String(req.body?._csrf || "");
    if (supplied.length !== req.session.csrfToken.length || !crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(req.session.csrfToken))) return res.status(403).render("Error.ejs", { message: "Your form expired. Please refresh and try again." });
  }
  next();
});
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  res.locals.mapToken = process.env.MAP_TOKEN || process.env.MAPBOX_TOKEN || "";
  next();
});

app.use("/", travelRouter);

// Retire the course-project property UI without deleting its data or source files.
app.use("/listings", (req, res) => res.redirect(301, "/journeys"));
app.use("/", userRouter);

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("Error.ejs", { message });
});

// app.get("/testListing", async (req, res) => {
//   let sampleListing = new Listing({
//     title: "My New Villa",
//     description: "By the beach",
//     price: 1200,
//     location: "Calangute, Goa",
//     country: "India",
//   });

//   await sampleListing.save();
//   console.log("sample was saved");
//   res.send("successful testing");
// });

const PORT = Number(process.env.PORT) || 8080;

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`server is listening to port ${port}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`port ${port} is busy, trying ${port + 1}`);
      startServer(port + 1);
    } else {
      console.log(err);
    }
  });
}

main()
  .then(() => {
    console.log("connected to DB");
    startServer(PORT);
  })
  .catch((err) => {
    console.log("DB connection failed:", err.message);
  });
