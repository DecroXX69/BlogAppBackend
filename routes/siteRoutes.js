// routes/siteRoutes.js - New site management routes

const express = require('express');
const {
  getUserSites,
  getSiteById,
  createSite,
  updateSite,
  deleteSite,
  regenerateApiKey
} = require('../controllers/siteController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getUserSites).post(protect, createSite);
router.route('/:id')
  .get(protect, getSiteById)
  .put(protect, updateSite)
  .delete(protect, deleteSite);
router.route('/:id/regenerate-key').post(protect, regenerateApiKey);

module.exports = router;