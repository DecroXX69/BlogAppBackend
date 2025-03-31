// models/siteModel.js

const mongoose = require('mongoose');

const siteSchema = mongoose.Schema(
  {
    siteId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    domain: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    apiKey: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    allowedOrigins: [String],
  },
  {
    timestamps: true,
  }
);

const Site = mongoose.model('Site', siteSchema);

module.exports = Site;