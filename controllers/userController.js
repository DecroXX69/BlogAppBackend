 // backend/controllers/userController.js
 const asyncHandler = require('express-async-handler');
 const User = require('../models/userModel');
 
 // @desc    Get user profile
 // @route   GET /api/users/profile
 // @access  Private
 const getUserProfile = asyncHandler(async (req, res) => {
   const user = await User.findById(req.user._id);
 
   if (user) {
     res.json({
       _id: user._id,
       name: user.name,
       email: user.email,
       isAdmin: user.isAdmin,
     });
   } else {
     res.status(404);
     throw new Error('User not found');
   }
 });
 
 // @desc    Update user profile
 // @route   PUT /api/users/profile
 // @access  Private
 const updateUserProfile = asyncHandler(async (req, res) => {
   const user = await User.findById(req.user._id);
 
   if (user) {
     user.name = req.body.name || user.name;
     user.email = req.body.email || user.email;
     if (req.body.password) {
       user.password = req.body.password;
     }
 
     const updatedUser = await user.save();
 
     res.json({
       _id: updatedUser._id,
       name: updatedUser.name,
       email: updatedUser.email,
       isAdmin: updatedUser.isAdmin,
     });
   } else {
     res.status(404);
     throw new Error('User not found');
   }
 });
 
 module.exports = { getUserProfile, updateUserProfile };