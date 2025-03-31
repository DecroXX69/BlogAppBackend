// middleware/apiKeyMiddleware.js

const asyncHandler = require('express-async-handler');
const Site = require('../models/siteModel');

const apiKeyAuth = asyncHandler(async (req, res, next) => {
  let apiKey;
  
  if (req.headers['x-api-key']) {
    try {
      apiKey = req.headers['x-api-key'];
      
      // Find site with this API key
      const site = await Site.findOne({ apiKey, isActive: true });
      
      if (!site) {
        res.status(401);
        throw new Error('Invalid API key');
      }
      
      // Check origin if request comes from browser
      const origin = req.headers.origin;
      if (origin && site.allowedOrigins.length > 0) {
        const isAllowed = site.allowedOrigins.some(allowedOrigin => {
          // Handle wildcards like *.example.com
          if (allowedOrigin.startsWith('*.')) {
            const domain = allowedOrigin.substring(2);
            return origin.endsWith(domain);
          }
          return origin === allowedOrigin;
        });
        
        if (!isAllowed) {
          res.status(403);
          throw new Error('Origin not allowed');
        }
      }
      
      // Add site info to request
      req.site = site;
      
      next();
    } catch (error) {
      console.error("API key auth error:", error.message);
      res.status(401);
      throw new Error('Not authorized, API key failed');
    }
  }
  
  if (!apiKey) {
    res.status(401);
    throw new Error('Not authorized, API key required');
  }
});

module.exports = { apiKeyAuth };