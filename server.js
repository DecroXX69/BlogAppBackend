// server.js - Updated with site routes and better CORS

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const blogRoutes = require('./routes/blogRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const siteRoutes = require('./routes/siteRoutes'); // New import
const path = require('path');

dotenv.config();

connectDB();

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow all origins for now - in production you would want to restrict this
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Api-Key']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/blogs', blogRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sites', siteRoutes); // Add the site routes

app.use(errorHandler);

app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);
  res.status(500).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));