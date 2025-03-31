// controllers/siteController.js

const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const Site = require('../models/siteModel');

// Generate a unique API key
const generateApiKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Get all sites for the current user
const getUserSites = asyncHandler(async (req, res) => {
  const sites = await Site.find({ owner: req.user._id });
  res.json(sites);
});

// Get a single site by ID
const getSiteById = asyncHandler(async (req, res) => {
  const site = await Site.findById(req.params.id);
  
  if (site) {
    // Check if user is owner or admin
    if (site.owner.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      res.status(401);
      throw new Error('Not authorized to view this site');
    }
    
    res.json(site);
  } else {
    res.status(404);
    throw new Error('Site not found');
  }
});

// Create a new site
const createSite = asyncHandler(async (req, res) => {
  const { name, domain, description, siteId, allowedOrigins } = req.body;
  
  // Validate required fields
  if (!name || !domain || !siteId) {
    res.status(400);
    throw new Error('Please provide name, domain, and siteId');
  }
  
  // Check if siteId is already taken
  const existingSite = await Site.findOne({ siteId });
  if (existingSite) {
    res.status(400);
    throw new Error('This site ID is already taken');
  }
  
  // Process allowed origins
  let origins = [];
  if (allowedOrigins) {
    origins = typeof allowedOrigins === 'string'
      ? allowedOrigins.split(',').map(origin => origin.trim())
      : Array.isArray(allowedOrigins) ? allowedOrigins : [];
  }
  
  // Always add the site's own domain
  if (!origins.includes(domain)) {
    origins.push(domain);
  }
  
  const site = await Site.create({
    name,
    domain,
    description,
    siteId,
    apiKey: generateApiKey(),
    owner: req.user._id,
    allowedOrigins: origins
  });
  
  if (site) {
    res.status(201).json(site);
  } else {
    res.status(400);
    throw new Error('Invalid site data');
  }
});

// Update a site
const updateSite = asyncHandler(async (req, res) => {
  const { name, domain, description, isActive, allowedOrigins } = req.body;
  
  const site = await Site.findById(req.params.id);
  
  if (site) {
    // Check if user is owner or admin
    if (site.owner.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      res.status(401);
      throw new Error('Not authorized to update this site');
    }
    
    // Process allowed origins
    let origins = site.allowedOrigins;
    if (allowedOrigins) {
      origins = typeof allowedOrigins === 'string'
        ? allowedOrigins.split(',').map(origin => origin.trim())
        : Array.isArray(allowedOrigins) ? allowedOrigins : site.allowedOrigins;
    }
    
    // Always ensure the domain is in allowed origins
    if (domain && !origins.includes(domain)) {
      origins.push(domain);
    }
    
    site.name = name || site.name;
    site.domain = domain || site.domain;
    site.description = description !== undefined ? description : site.description;
    site.isActive = isActive !== undefined ? isActive : site.isActive;
    site.allowedOrigins = origins;
    
    const updatedSite = await site.save();
    res.json(updatedSite);
  } else {
    res.status(404);
    throw new Error('Site not found');
  }
});

// Delete a site
const deleteSite = asyncHandler(async (req, res) => {
  const site = await Site.findById(req.params.id);
  
  if (site) {
    // Check if user is owner or admin
    if (site.owner.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      res.status(401);
      throw new Error('Not authorized to delete this site');
    }
    
    await site.deleteOne();
    res.json({ message: 'Site removed' });
  } else {
    res.status(404);
    throw new Error('Site not found');
  }
});

// Generate a new API key
const regenerateApiKey = asyncHandler(async (req, res) => {
  const site = await Site.findById(req.params.id);
  
  if (site) {
    // Check if user is owner or admin
    if (site.owner.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      res.status(401);
      throw new Error('Not authorized to update this site');
    }
    
    site.apiKey = generateApiKey();
    const updatedSite = await site.save();
    
    res.json({
      message: 'API key regenerated successfully',
      apiKey: updatedSite.apiKey
    });
  } else {
    res.status(404);
    throw new Error('Site not found');
  }
});

module.exports = {
  getUserSites,
  getSiteById,
  createSite,
  updateSite,
  deleteSite,
  regenerateApiKey
};