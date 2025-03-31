// controllers/blogController.js - Updated with site filtering

const asyncHandler = require('express-async-handler');
const Blog = require('../models/blogModel');

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

  const filterCategory = req.query.category
    ? { category: req.query.category }
    : {};

  // New site filter logic
  const filterSite = req.query.siteId
    ? {
        $or: [
          { siteId: req.query.siteId },
          { sites: req.query.siteId },
          { isGlobal: true }
        ]
      }
    : {};

  const count = await Blog.countDocuments({ 
    ...keyword, 
    ...filterPublished, 
    ...filterCategory, 
    ...filterSite 
  });
  
  const blogs = await Blog.find({ 
    ...keyword, 
    ...filterPublished, 
    ...filterCategory, 
    ...filterSite 
  })
    .populate('author', 'name')
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ createdAt: -1 });

  res.json({ blogs, page, pages: Math.ceil(count / pageSize), total: count });
});

// Update createBlog to handle site information
const createBlog = asyncHandler(async (req, res) => {
  try {
    console.log("Request body:", req.body);
    
    if (!req.user || !req.user._id) {
      console.error("User not found in request");
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    console.log("User in request:", req.user._id);
    
    const { 
      title, 
      content, 
      excerpt, 
      featuredImage, 
      tags, 
      category, 
      published,
      siteId,       // New field
      sites,        // New field
      isGlobal      // New field
    } = req.body;
    
    let processedTags = [];
    if (tags) {
      processedTags = typeof tags === 'string' 
        ? tags.split(',').map(tag => tag.trim()) 
        : Array.isArray(tags) ? tags : [];
    }
    
    // Process sites array
    let processSites = [];
    if (sites) {
      processSites = typeof sites === 'string'
        ? sites.split(',').map(site => site.trim())
        : Array.isArray(sites) ? sites : [];
    }

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }
    if (!excerpt) {
      return res.status(400).json({ message: "Excerpt is required" });
    }
    
    const blogData = {
      title,
      content,
      excerpt,
      featuredImage: featuredImage || '/images/default-blog.jpg',
      author: req.user._id,
      tags: processedTags,
      category: category || 'Uncategorized',
      published: published || false,
      slug: title.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-'),
      siteId: siteId || null,
      sites: processSites,
      isGlobal: isGlobal || false
    };
    
    console.log("Blog data to save:", blogData);
    
    const blog = new Blog(blogData);
    const createdBlog = await blog.save();
    
    console.log("Blog created successfully:", createdBlog);
    res.status(201).json(createdBlog);
  } catch (error) {
    console.error("Detailed error creating blog:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    if (error.errors) {
      console.error("Validation errors:", error.errors);
    }
    
    if (error.code === 11000) {
      console.error("Duplicate key error:", error.keyValue);
      return res.status(400).json({
        message: "A blog with this title already exists. Please use a different title.",
        field: Object.keys(error.keyValue)[0]
      });
    }
    res.status(500).json({ 
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
      errors: error.errors
    });
  }
});

// Update updateBlog to handle site information
const updateBlog = asyncHandler(async (req, res) => {
  const { 
    title, 
    content, 
    excerpt, 
    featuredImage, 
    tags, 
    category, 
    published, 
    siteId, 
    sites, 
    isGlobal 
  } = req.body;

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
    blog.tags = tags ? (typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags) : blog.tags;
    blog.category = category || blog.category;
    
    // Handle site-related fields
    if (siteId !== undefined) {
      blog.siteId = siteId;
    }
    
    if (sites !== undefined) {
      blog.sites = typeof sites === 'string' 
        ? sites.split(',').map(site => site.trim()) 
        : sites;
    }
    
    if (isGlobal !== undefined) {
      blog.isGlobal = isGlobal;
    }
    
    if (published !== undefined) {
      blog.published = published;
     
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

// Add a new method to get blogs for a specific site
const getSiteBlogs = asyncHandler(async (req, res) => {
  const siteId = req.params.siteId;
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;
  
  const filterPublished = { published: true }; // Only published blogs for site display
  
  const filterSite = {
    $or: [
      { siteId: siteId },
      { sites: siteId },
      { isGlobal: true }
    ]
  };

  const count = await Blog.countDocuments({ ...filterPublished, ...filterSite });
  
  const blogs = await Blog.find({ ...filterPublished, ...filterSite })
    .populate('author', 'name')
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ createdAt: -1 });

  res.json({ blogs, page, pages: Math.ceil(count / pageSize), total: count });
});

// Keep all your other methods the same...
const getBlogById = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate('author', 'name');

  if (blog) {
    // Increment view count
    blog.viewCount += 1;
    await blog.save();
    res.json(blog);
  } else {
    res.status(404);
    throw new Error('Blog not found');
  }
});

const getBlogBySlug = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug }).populate('author', 'name');

  if (blog) {
    // Increment view count
    blog.viewCount += 1;
    await blog.save();
    res.json(blog);
  } else {
    res.status(404);
    throw new Error('Blog not found');
  }
});

const getBlogByShareableLink = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ shareableLink: req.params.shareableLink }).populate('author', 'name');

  if (blog) {
    // Increment view count
    blog.viewCount += 1;
    await blog.save();
    res.json(blog);
  } else {
    res.status(404);
    throw new Error('Blog not found');
  }
});

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

const getUserBlogs = asyncHandler(async (req, res) => {
  const blogs = await Blog.find({ author: req.user._id }).sort({ createdAt: -1 });
  res.json(blogs);
});

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Blog.distinct('category');
  res.json(categories);
});

module.exports = {
  getBlogs,
  getBlogById,
  getBlogBySlug,
  getBlogByShareableLink,
  createBlog,
  updateBlog,
  deleteBlog,
  getUserBlogs,
  getCategories,
  getSiteBlogs, // New export
};