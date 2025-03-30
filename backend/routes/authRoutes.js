const express = require("express");
const passport = require("passport");

const router = express.Router();

// 🔹 Google OAuth Login Route
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// 🔹 Google OAuth Callback Route
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("https://video-conferencing-bice.vercel.app/");

  }
);

// 🔹 Logout Route
// 🔹 Logout Route
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).send("Error logging out");
    res.status(200).json({ message: "Logged out successfully" }); // ✅ No redirect
  });
});


// 🔹 Route to get current user info
router.get("/user", (req, res) => {
  res.json({ user: req.user || null });
});

module.exports = router;
