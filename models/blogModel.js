// backend/models/blogModel.js
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
    published: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create slug from title before saving
blogSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  }
  
  if (this.isModified('published') && this.published && !this.publishedAt) {
    this.publishedAt = Date.now();
  }
  
  next();
});

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;