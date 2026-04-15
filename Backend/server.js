// ===================================
//   BRAINBALANCE — NODE.JS SERVER
//   Full-featured mental wellness platform
//   Express + MongoDB + AI + ML
// ===================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Connect to MongoDB ──
connectDB();

// ── Middleware ──
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve all frontend files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// ── API Routes ──
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/predict', require('./routes/predict'));
app.use('/api/history', require('./routes/history'));
app.use('/api/chat',    require('./routes/chat'));
app.use('/api/report',  require('./routes/report'));

// ── Health Check ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    features: {
      ml: true,
      chat: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE',
      database: true,
      pdf: true
    }
  });
});

// ── Serve frontend for all non-API routes (SPA fallback) ──
app.get('/{*path}', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// ── Start Server ──
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🧠 BrainBalance Server Running      ║
║   http://localhost:${PORT}               ║
║                                        ║
║   Features:                            ║
║   ✅ ML Stress Prediction              ║
║   ✅ AI Chat Therapist                 ║
║   ✅ User Authentication               ║
║   ✅ Stress History Dashboard          ║
║   ✅ Smart Recommendations             ║
║   ✅ PDF Report Generator              ║
║   ✅ Gamification System               ║
║   ✅ Voice Input                       ║
║   ✅ PWA Support                       ║
╚════════════════════════════════════════╝
  `);
});
