
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

  const count = await Blog.countDocuments({ ...keyword, ...filterPublished });
  const blogs = await Blog.find({ ...keyword, ...filterPublished })
    .populate('author', 'name')
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ createdAt: -1 });

  res.json({ blogs, page, pages: Math.ceil(count / pageSize), total: count });
});


const getBlogById = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate('author', 'name');

  if (blog) {
    res.json(blog);
  } else {
    res.status(404);
    throw new Error('Blog not found');
  }
});


const getBlogBySlug = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug }).populate('author', 'name');

  if (blog) {
    res.json(blog);
  } else {
    res.status(404);
    throw new Error('Blog not found');
  }
});


const createBlog = asyncHandler(async (req, res) => {
  try {
    console.log("Request body:", req.body);
    
   
    if (!req.user || !req.user._id) {
      console.error("User not found in request");
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    console.log("User in request:", req.user._id);
    
    const { title, content, excerpt, featuredImage, tags, published } = req.body;
    
   
    let processedTags = [];
    if (tags) {
      processedTags = typeof tags === 'string' 
        ? tags.split(',').map(tag => tag.trim()) 
        : Array.isArray(tags) ? tags : [];
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
      published: published || false,
      slug: title.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-'),
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
    // In your createBlog controller's catch block
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
  
  module.exports = {
    getBlogs,
    getBlogById,
    getBlogBySlug,
    createBlog,
    updateBlog,
    deleteBlog,
    getUserBlogs,
  };
  
 