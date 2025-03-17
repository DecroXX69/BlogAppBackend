// backend/routes/blogRoutes.js
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
} = require('../controllers/blogController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(getBlogs).post(protect, createBlog);
router.route('/user').get(protect, getUserBlogs);
router.route('/categories').get(getCategories);
router.route('/slug/:slug').get(getBlogBySlug);
router.route('/share/:shareableLink').get(getBlogByShareableLink);
router.route('/:id').get(getBlogById).put(protect, updateBlog).delete(protect, deleteBlog);

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