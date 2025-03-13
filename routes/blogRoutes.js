// backend/routes/blogRoutes.js
const express = require('express');
const {
  getBlogs,
  getBlogById,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
  getUserBlogs,
} = require('../controllers/blogController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(getBlogs).post(protect, createBlog);
router.route('/user').get(protect, getUserBlogs);
router.route('/slug/:slug').get(getBlogBySlug);
router.route('/:id').get(getBlogById).put(protect, updateBlog).delete(protect, deleteBlog);
// Add this to your routes file
router.post('/test-connection', protect, (req, res) => {
  try {
    res.status(200).json({ 
      success: true, 
      user: req.user._id,
      message: 'Connection and authentication working' 
    });
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;