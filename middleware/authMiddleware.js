
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');


const protect = asyncHandler(async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      console.log("Token received:", token.substring(0, 10) + "..."); 
      
     
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded user ID:", decoded.id);
      
      
      req.user = await User.findById(decoded.id).select('-password');
      console.log("User found:", req.user ? req.user._id : "No user found");
      
      next();
    } catch (error) {
      console.error("Auth middleware error:", error.message);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }
  
  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});
const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as an admin');
  }
};

module.exports = { protect, admin };