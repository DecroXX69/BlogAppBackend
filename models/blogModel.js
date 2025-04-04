// models/blogModel.js - Updated version with site field

const mongoose = require('mongoose');

const blogSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
    },
    content: {
      type: String,
      required: [true, 'Please add content'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    excerpt: {
      type: String,
      required: [true, 'Please add an excerpt'],
    },
    featuredImage: {
      type: String,
      default: '/images/default-blog.jpg',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    tags: [String],
    category: {
      type: String,
      default: 'Uncategorized',
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    published: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
    shareableLink: {
      type: String,
      unique: true,
      sparse: true,
    },
    // New fields for site integration
    siteId: {
      type: String,
      index: true, // Add index for better query performance
    },
    // Optional array to support displaying on multiple sites
    sites: [{
      type: String
    }],
    // For controlling visibility across different sites
    isGlobal: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

// Keep your existing pre-save hooks
blogSchema.pre('save', function(next) {
  if (this.isModified('title') && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  }
  
  if (this.isModified('published') && this.published && !this.publishedAt) {
    this.publishedAt = Date.now();
  }
  
  // Generate a unique shareable link if it doesn't exist and the blog is published
  if (this.published && !this.shareableLink) {
    this.shareableLink = `${this.slug}-${Date.now().toString(36)}`;
  }
  
  next();
});

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;