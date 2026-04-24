// ===================================
//   BRAINBALANCE — STRESS RECORD MODEL
//   Stores each assessment result for history
// ===================================

const mongoose = require('mongoose');

const stressRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Input data
  inputs: {
    sleep:        { type: Number, required: true },
    work:         { type: Number, required: true },
    screen:       { type: Number, required: true },
    mood:         { type: Number, required: true },
    exercise:     { type: Number, required: true },
    caffeine:     { type: Number, default: 0 },
    deadlines:    { type: Number, default: 5 },
    social:       { type: Number, default: 1 },
    sleepQuality: { type: Number, default: 3 }
  },
  // Prediction results
  result: {
    stress_level:  { type: String, required: true },
    burnout_risk:  { type: String, required: true },
    confidence:    { type: Number, default: null },
    score:         { type: Number, default: null }
  },
  // Generated advice and recommendations
  advice: {
    type: [String],
    default: []
  },
  // XP earned from this assessment
  xpEarned: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
stressRecordSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('StressRecord', stressRecordSchema);
