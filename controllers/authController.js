const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const User     = require("../models/user");
const { redisClient } = require("../config/redis");

const sendError   = (res, status, message) => {
  res.status(status).json({ success: false, message });
};

const sendSuccess = (res, status, message, data = {}) => {
  res.status(status).json({ success: true, message, ...data });
};
//this func generates token which will be used later on
const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

//this func calculates the expiry time in seconds for Redis based on the JWT_EXPIRES_IN env variable
const getExpirySeconds = () => {
  const val = process.env.JWT_EXPIRES_IN || "7d";
  const unit = val.slice(-1);
  const num  = parseInt(val);
  const map  = { s: 1, m: 60, h: 3600, d: 86400 };
  return (map[unit] || 86400) * num;
};

// route for signing up => POST => /api/auth/signup
const signUp = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return sendError(res, 400, "All fields are required");
  }
  if (password.length < 6) {
    return sendError(res, 400, "Password must be at least 6 characters");
  }
  try {
    // we will check if the email is already registered or not :)
    const exists = await User.emailExists(email);
    if (exists) {
      return sendError(res, 409, "Email already registered");
    }

    // we must hash the pass before storing in db
    const hashedPassword = await bcrypt.hash(password, 10);

    // if the user doesnt alreadfy exist then create the user and generate token for that user :)
    const user  = await User.create({ name, email, hashedPassword });
    const token = generateToken(user.id);

    // we need to create a session in Redis for this user so that we can validate the token later on :)
    await redisClient.setEx(`session:${user.id}`, 60 * 60 * 24 * 7, token);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user,
    });
  } catch (error) {
    sendError(res, 500, "Server error");
  }
};

// route for logging in => POST => /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 400, "Email and password are required");
  } 
  try {
    //email exists or not ?
    const user = await User.findByEmail(email);
    if (!user) {
      return sendError(res, 401, "Invalid email or password");
    }

    //passwords match or not ?
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 401, "Invalid email or password");
    }

    const token = generateToken(user.id);

    // refresh the session in Redis with the new token and expiry time :) [imp]
    await redisClient.setEx(
      `session:${user.id}`,
      getExpirySeconds(),
      token
    );
    sendSuccess(res, 200, "Login successful", {
  token,
  user: { id: user.id, name: user.name, email: user.email },
});
  } catch (error) {
    sendError(res, 500, "Server error");
  }
};


// route for getting profile => GET => /api/auth/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    sendSuccess(res, 200, "Profile fetched successfully", { user });
  } catch (error) {
    sendError(res, 500, "Server error");
  }
};


// route for logging out => POST => /api/auth/logout
const logout = async (req, res) => {
  try {
    await redisClient.del(`session:${req.user.id}`);
    sendSuccess(res, 200, "Logged out successfully");
  } catch (error) {
    sendError(res, 500, "Server error");
  }
};

module.exports = { signUp, login, getProfile, logout };