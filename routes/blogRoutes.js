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

module.exports = router;