const express = require("express");
const router  = express.Router();
const { signUp, login, getProfile, logout } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/signup",  signUp);
router.post("/login",   login);
router.post("/logout",  protect, logout);  // protect so we know which session to delete
router.get("/profile",  protect, getProfile);
//using post method for signup,login,logout and get method for profile
module.exports = router;