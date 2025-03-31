// routes/blogRoutes.js - Updated with site routes

const express = require('express');
const {
  getBlogs,
  getBlogById,
  getBlogBySlug,
  getBlogByShareableLink,
  createBlog,
  updateBlog,
  deleteBlog,
  getUserBlogs,
  getCategories,
  getSiteBlogs,
} = require('../controllers/blogController');
const { protect } = require('../middleware/authMiddleware');
const { apiKeyAuth } = require('../middleware/apiKeyMiddleware');

const router = express.Router();

// Standard blog routes
router.route('/').get(getBlogs).post(protect, createBlog);
router.route('/user').get(protect, getUserBlogs);
router.route('/categories').get(getCategories);
router.route('/slug/:slug').get(getBlogBySlug);
router.route('/share/:shareableLink').get(getBlogByShareableLink);
router.route('/:id').get(getBlogById).put(protect, updateBlog).delete(protect, deleteBlog);

// New site-specific routes
router.route('/site/:siteId').get(getSiteBlogs);

// API key authenticated routes for external sites
router.route('/external/site/:siteId').get(apiKeyAuth, getSiteBlogs);

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