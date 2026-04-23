// ===================================
//   BRAINBALANCE — HISTORY ROUTES
//   Stress history CRUD + stats
// ===================================

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const StressRecord = require('../models/StressRecord');

const router = express.Router();

// ── GET /api/history ──
// Fetch user's past stress records (paginated)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const records = await StressRecord.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await StressRecord.countDocuments({ userId: req.user.id });

    res.json({
      records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// ── GET /api/history/stats ──
// Aggregated stats for dashboard charts
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const records = await StressRecord.find({
      userId: req.user.id,
      createdAt: { $gte: since }
    }).sort({ createdAt: 1 });

    // Daily stress levels for chart
    const dailyData = {};
    records.forEach(record => {
      const date = record.createdAt.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { 
          date, 
          scores: [], 
          stressLevels: [],
          count: 0 
        };
      }
      dailyData[date].scores.push(record.result.score || 0);
      dailyData[date].stressLevels.push(record.result.stress_level);
      dailyData[date].count++;
    });

    // Calculate averages
    const chartData = Object.values(dailyData).map(day => ({
      date: day.date,
      avgScore: day.scores.reduce((a, b) => a + b, 0) / day.scores.length,
      dominantStress: mode(day.stressLevels),
      assessments: day.count
    }));

    // Overall stats
    const totalRecords = records.length;
    const stressCounts = { Low: 0, Medium: 0, High: 0 };
    records.forEach(r => {
      if (stressCounts[r.result.stress_level] !== undefined) {
        stressCounts[r.result.stress_level]++;
      }
    });

    res.json({
      chartData,
      summary: {
        totalAssessments: totalRecords,
        stressDistribution: stressCounts,
        avgSleep: average(records.map(r => r.inputs.sleep)),
        avgWork: average(records.map(r => r.inputs.work)),
        avgScreen: average(records.map(r => r.inputs.screen)),
        period: `${days} days`
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ── DELETE /api/history/:id ──
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const record = await StressRecord.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }
    await StressRecord.deleteOne({ _id: req.params.id });
    res.json({ message: 'Record deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

// Helper: find most common element
function mode(arr) {
  const counts = {};
  arr.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
}

// Helper: average
function average(arr) {
  if (arr.length === 0) return 0;
  return +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
}

module.exports = router;
