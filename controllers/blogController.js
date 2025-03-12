// backend/controllers/blogController.js
const asyncHandler = require('express-async-handler');
const Blog = require('../models/blogModel');

// @desc    Get all blogs
// @route   GET /api/blogs
// @access  Public
const getBlogs = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;
  
  const keyword = req.query.keyword
    ? {
        $or: [
          { title: { $regex: req.query.keyword, $options: 'i' } },
          { content: { $regex: req.query.keyword, $options: 'i' } },
          { tags: { $regex: req.query.keyword, $options: 'i' } },
        ],
      }
    : {};

  const filterPublished = req.query.published === 'true' 
    ? { published: true }
    : req.query.published === 'false'
    ? { published: false }
    : {};

  const count = await Blog.countDocuments({ ...keyword, ...filterPublished });
  const blogs = await Blog.find({ ...keyword, ...filterPublished })
    .populate('author', 'name')
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ createdAt: -1 });

  res.json({ blogs, page, pages: Math.ceil(count / pageSize), total: count });
});

// @desc    Get blog by ID
// @route   GET /api/blogs/:id
// @access  Public
const getBlogById = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate('author', 'name');

  if (blog) {
    res.json(blog);
  } else {
    res.status(404);
    throw new Error('Blog not found');
  }
});

// @desc    Get blog by slug
// @route   GET /api/blogs/slug/:slug
// @access  Public
const getBlogBySlug = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug }).populate('author', 'name');

  if (blog) {
    res.json(blog);
  } else {
    res.status(404);
    throw new Error('Blog not found');
  }
});

// @desc    Create a blog
// @route   POST /api/blogs
// @access  Private
const createBlog = asyncHandler(async (req, res) => {
  const { title, content, excerpt, featuredImage, tags, published } = req.body;

  const blog = new Blog({
    title,
    content,
    excerpt,
    featuredImage: featuredImage || '/images/default-blog.jpg',
    author: req.user._id,
    tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
    published: published || false,
    slug: title.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-'),
  });

  const createdBlog = await blog.save();
  res.status(201).json(createdBlog);
});

const updateBlog = asyncHandler(async (req, res) => {
    const { title, content, excerpt, featuredImage, tags, published } = req.body;
  
    const blog = await Blog.findById(req.params.id);
  
    if (blog) {
      // Check if user is author or admin
      if (blog.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        res.status(401);
        throw new Error('Not authorized to edit this blog');
      }
  
      blog.title = title || blog.title;
      blog.content = content || blog.content;
      blog.excerpt = excerpt || blog.excerpt;
      blog.featuredImage = featuredImage || blog.featuredImage;
      blog.tags = tags ? tags.split(',').map(tag => tag.trim()) : blog.tags;
      
      // Only update published status if explicitly provided
      if (published !== undefined) {
        blog.published = published;
        // Set publishedAt if publishing for the first time
        if (published && !blog.publishedAt) {
          blog.publishedAt = Date.now();
        }
      }
  
      const updatedBlog = await blog.save();
      res.json(updatedBlog);
    } else {
      res.status(404);
      throw new Error('Blog not found');
    }
  });
  
  // @desc    Delete a blog
  // @route   DELETE /api/blogs/:id
  // @access  Private
  const deleteBlog = asyncHandler(async (req, res) => {
    const blog = await Blog.findById(req.params.id);
  
    if (blog) {
      // Check if user is author or admin
      if (blog.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        res.status(401);
        throw new Error('Not authorized to delete this blog');
      }
  
      await blog.deleteOne();
      res.json({ message: 'Blog removed' });
    } else {
      res.status(404);
      throw new Error('Blog not found');
    }
  });
  
  // @desc    Get user blogs
  // @route   GET /api/blogs/user
  // @access  Private
  const getUserBlogs = asyncHandler(async (req, res) => {
    const blogs = await Blog.find({ author: req.user._id }).sort({ createdAt: -1 });
    res.json(blogs);
  });
  
  module.exports = {
    getBlogs,
    getBlogById,
    getBlogBySlug,
    createBlog,
    updateBlog,
    deleteBlog,
    getUserBlogs,
  };
  
 