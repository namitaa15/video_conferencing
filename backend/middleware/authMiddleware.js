// /middleware/authMiddleware.js
module.exports = function protectRoute(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    } else {
      return res.status(401).json({ message: "Not authorized" });
    }
  };  