const mongoose = require('mongoose');

const artisanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    profession: {
      type: String,
      required: true,
      trim: true,
    },
    bio: {
      type: String,
      default: '',
      trim: true,
    },
    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },
    skills: {
      type: [String],
      default: [],
    },
    serviceAreas: {
      type: [String],
      default: [],
    },
    hourlyRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Artisan', artisanSchema);
