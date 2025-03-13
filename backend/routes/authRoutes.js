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
    res.redirect("http://localhost:5173/dashboard"); // Redirect to frontend dashboard after login
  }
);

// 🔹 Logout Route
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).send("Error logging out");
    res.redirect("http://localhost:5173/"); // Redirect to home after logout
  });
});

module.exports = router;