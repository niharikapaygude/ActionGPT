//basically the bouncer/protector middleware that checks if the user is authenticated 
// before allowing access to protected routes
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const sendError   = (res, status, message) => {
  res.status(status).json({ success: false, message });
};

const protect = async (req, res, next) => {
  let token;
  //okay so here we are checking if the authorization header exists and starts with "Bearer ", 
  // if it does we split the header to get the token part [authorization : bearer token]
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  //the second pat [1] is the token part of the header
  }

  if (!token) {
    return sendError(res, 401, "No token provided, authorization denied");
  }

  try {
    // verify the token and decode it to get the user ID and other information
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // find the user by ID from the decoded token
    const user = await User.findById(decoded.id);
    if (!user) {
      return sendError(res, 401, "User not found");
    }

    req.user = user;
    next();
  } catch {
    return sendError(res, 401, "Token invalid or expired");
  }
};

module.exports = { protect };