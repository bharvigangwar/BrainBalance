// ===================================
//   BRAINBALANCE — PREDICT ROUTES
//   ML prediction + smart recommendations
// ===================================

const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const { optionalAuth } = require('../middleware/auth');
const StressRecord = require('../models/StressRecord');
const User = require('../models/User');

const router = express.Router();

const PREDICT_SCRIPT = path.join(__dirname, '..', '..', 'model', 'predict.py');
const PYTHON_EXECUTABLE = path.join(__dirname, '..', '..', '.venv', 'Scripts', 'python.exe');

// ── Smart Recommendations Engine ──
function generateRecommendations(inputs, result) {
  const tips = [];

  // Sleep-based recommendations
  if (inputs.sleep < 5) {
    tips.push("🛌 Critical: You slept less than 5 hours! Aim for 7–8 hours tonight. Set an alarm to remind you to wind down.");
  } else if (inputs.sleep < 7) {
    tips.push("😴 You're under-sleeping. Try going to bed 30 minutes earlier tonight for better recovery.");
  } else if (inputs.sleep >= 8) {
    tips.push("✅ Great sleep! Keep maintaining this 7-8 hour rhythm.");
  }

  // Sleep quality recommendations
  if (inputs.sleepQuality && inputs.sleepQuality <= 2) {
    tips.push("🌙 Your sleep quality is poor. Try reducing screen time 1 hour before bed, and keep your room cool and dark.");
  }

  // Work hours
  if (inputs.work > 12) {
    tips.push("⚠️ Working 12+ hours is unsustainable. Break your work into 90-minute focus blocks with 15-min breaks.");
  } else if (inputs.work > 9) {
    tips.push("📋 Long work day. Use the Pomodoro technique: 25 min work → 5 min break. Your brain needs micro-recoveries.");
  } else if (inputs.work <= 6) {
    tips.push("👍 Balanced work hours. Use your free time for hobbies or physical activity.");
  }

  // Screen time
  if (inputs.screen > 6) {
    tips.push("📱 Screen time is very high! Try the 20-20-20 rule: every 20 min, look 20 feet away for 20 seconds. Reduce by 20%.");
  } else if (inputs.screen > 4) {
    tips.push("🖥️ Moderate screen time. Consider swapping 30 minutes of scrolling for a walk or reading a physical book.");
  }

  // Mood
  if (inputs.mood <= 2) {
    tips.push("💙 Your mood is low. Talk to someone you trust today — even a 5-minute call can make a difference.");
  }

  // Exercise
  if (inputs.exercise === 0) {
    tips.push("🏃 No exercise today! Even a 15-minute brisk walk can reduce cortisol by 15%. Start small.");
  } else {
    tips.push("💪 Great job exercising! Physical activity is one of the most effective stress reducers.");
  }

  // Caffeine
  if (inputs.caffeine && inputs.caffeine > 4) {
    tips.push("☕ High caffeine intake! More than 4 cups can increase anxiety. Switch to water or herbal tea after 2 PM.");
  } else if (inputs.caffeine && inputs.caffeine > 2) {
    tips.push("☕ Moderate caffeine. Avoid coffee after 3 PM to protect your sleep quality.");
  }

  // Deadlines pressure
  if (inputs.deadlines && inputs.deadlines >= 8) {
    tips.push("📅 High deadline pressure! Break tasks into smaller chunks. Focus on what's due in the next 24 hours first.");
  }

  // Social interaction
  if (inputs.social !== undefined && inputs.social < 1) {
    tips.push("👥 You had very little social interaction. Even brief conversations can improve mental health. Reach out to a friend today.");
  }

  // Combined risk patterns
  if (inputs.sleep < 6 && inputs.work > 10) {
    tips.push("🚨 Dangerous combo: low sleep + long work hours. This is a burnout warning sign. Prioritize rest tonight.");
  }

  if (inputs.mood <= 2 && inputs.exercise === 0 && inputs.social < 1) {
    tips.push("❤️ Triple risk detected: low mood, no exercise, no social time. Try one small change today — a 10-minute walk or a quick call to a friend.");
  }

  return tips;
}

// Calculate XP earned from assessment
function calculateXP(result) {
  let xp = 10; // base XP for completing assessment
  if (result.stress_level === 'Low') xp += 25;
  else if (result.stress_level === 'Medium') xp += 10;
  return xp;
}

// Check and award badges
async function checkBadges(userId) {
  const user = await User.findById(userId);
  if (!user) return [];
  const newBadges = [];
  const existingIds = user.badges.map(b => b.id);

  // Count total records
  const totalRecords = await StressRecord.countDocuments({ userId });

  // First Check-in badge
  if (totalRecords >= 1 && !existingIds.includes('first_checkin')) {
    const badge = { id: 'first_checkin', name: 'First Check-in', icon: '🌱' };
    user.badges.push(badge);
    newBadges.push(badge);
  }

  // 5 assessments
  if (totalRecords >= 5 && !existingIds.includes('five_checkins')) {
    const badge = { id: 'five_checkins', name: 'Consistent Tracker', icon: '📊' };
    user.badges.push(badge);
    newBadges.push(badge);
  }

  // 10 assessments
  if (totalRecords >= 10 && !existingIds.includes('ten_checkins')) {
    const badge = { id: 'ten_checkins', name: 'Dedicated User', icon: '🏆' };
    user.badges.push(badge);
    newBadges.push(badge);
  }

  // Check for low-stress streak
  const recentRecords = await StressRecord.find({ userId })
    .sort({ createdAt: -1 }).limit(5);
  const consecutiveLow = recentRecords.every(r => r.result.stress_level === 'Low');
  if (recentRecords.length >= 5 && consecutiveLow && !existingIds.includes('balanced_life')) {
    const badge = { id: 'balanced_life', name: 'Balanced Life', icon: '⭐' };
    user.badges.push(badge);
    newBadges.push(badge);
  }

  // Check for 3 consecutive Low stress
  if (recentRecords.length >= 3 && recentRecords.slice(0, 3).every(r => r.result.stress_level === 'Low') && !existingIds.includes('healthy_streak')) {
    const badge = { id: 'healthy_streak', name: 'Healthy Streak', icon: '💪' };
    user.badges.push(badge);
    newBadges.push(badge);
  }

  // Update streak
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastCheckIn = user.streak.lastCheckIn ? new Date(user.streak.lastCheckIn) : null;

  if (lastCheckIn) {
    lastCheckIn.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today - lastCheckIn) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      user.streak.current += 1;
      if (user.streak.current > user.streak.longest) {
        user.streak.longest = user.streak.current;
      }
    } else if (diffDays > 1) {
      user.streak.current = 1;
    }
    // if diffDays === 0, same day — don't change streak
  } else {
    user.streak.current = 1;
  }
  user.streak.lastCheckIn = new Date();

  // Streak badges
  if (user.streak.current >= 3 && !existingIds.includes('three_day_streak')) {
    const badge = { id: 'three_day_streak', name: '3-Day Streak', icon: '🔥' };
    user.badges.push(badge);
    newBadges.push(badge);
  }
  if (user.streak.current >= 7 && !existingIds.includes('mindful_week')) {
    const badge = { id: 'mindful_week', name: 'Mindful Week', icon: '🧘' };
    user.badges.push(badge);
    newBadges.push(badge);
  }

  await user.save();
  return newBadges;
}


// ── POST /api/predict ──
router.post('/', optionalAuth, async (req, res) => {
  const userInput = req.body;
  const inputJSON = JSON.stringify(userInput);

  // Try Python ML model first
  const fs = require('fs');
  const pythonExists = fs.existsSync(PYTHON_EXECUTABLE);
  const scriptExists = fs.existsSync(PREDICT_SCRIPT);

  if (pythonExists && scriptExists) {
    const python = spawn(PYTHON_EXECUTABLE, [PREDICT_SCRIPT, inputJSON]);
    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data) => { output += data.toString(); });
    python.stderr.on('data', (data) => { errorOutput += data.toString(); });

    python.on('error', (err) => {
      console.warn('Python process error, using fallback:', err.message);
      const result = localPredict(userInput);
      return respondWithResult(req, res, userInput, result);
    });

    python.on('close', async (code) => {
      if (code !== 0) {
        console.warn('Python error, using fallback. Error:', errorOutput);
        const result = localPredict(userInput);
        return respondWithResult(req, res, userInput, result);
      }
      try {
        const result = JSON.parse(output.trim());
        return respondWithResult(req, res, userInput, result);
      } catch (e) {
        const result = localPredict(userInput);
        return respondWithResult(req, res, userInput, result);
      }
    });
  } else {
    // Fallback to local prediction
    console.warn('Python not found, using local prediction fallback.');
    const result = localPredict(userInput);
    return respondWithResult(req, res, userInput, result);
  }
});

// Respond with prediction + recommendations + gamification
async function respondWithResult(req, res, inputs, result) {
  // Generate smart recommendations
  const recommendations = generateRecommendations(inputs, result);
  const xpEarned = calculateXP(result);

  const response = {
    stress_level: result.stress_level,
    burnout_risk: result.burnout_risk,
    confidence: result.confidence || null,
    recommendations,
    xpEarned
  };

  // If user is logged in, save to history and update gamification
  if (req.user) {
    try {
      await StressRecord.create({
        userId: req.user.id,
        inputs,
        result: {
          stress_level: result.stress_level,
          burnout_risk: result.burnout_risk,
          confidence: result.confidence || null,
          score: result.score || null
        },
        advice: recommendations,
        xpEarned
      });

      // Update user XP
      const user = await User.findById(req.user.id);
      if (user) {
        user.xp += xpEarned;
        user.level = Math.floor(user.xp / 100) + 1;
        await user.save();

        // Check for new badges
        const newBadges = await checkBadges(req.user.id);

        response.gamification = {
          xp: user.xp,
          level: user.level,
          xpEarned,
          newBadges,
          streak: user.streak,
          badges: user.badges
        };
      }
    } catch (err) {
      console.error('Error saving stress record:', err);
      // Don't fail the response — just skip saving
    }
  }

  res.json(response);
}

// ── Local Prediction Fallback ──
function localPredict(data) {
  let score = 0;

  if (data.sleep < 5) score += 3;
  else if (data.sleep < 7) score += 1;

  if (data.work > 10) score += 3;
  else if (data.work > 8) score += 1;

  if (data.screen > 6) score += 2;
  else if (data.screen > 4) score += 1;

  if (data.mood <= 2) score += 3;
  else if (data.mood === 3) score += 1;

  if (data.exercise === 0) score += 1;

  // New features
  if (data.caffeine && data.caffeine > 4) score += 2;
  else if (data.caffeine && data.caffeine > 2) score += 1;

  if (data.deadlines && data.deadlines >= 8) score += 2;
  else if (data.deadlines && data.deadlines >= 5) score += 1;

  if (data.social !== undefined && data.social < 1) score += 1;

  if (data.sleepQuality && data.sleepQuality <= 2) score += 2;
  else if (data.sleepQuality && data.sleepQuality <= 3) score += 1;

  let stress_level;
  if (score <= 3) stress_level = 'Low';
  else if (score <= 7) stress_level = 'Medium';
  else stress_level = 'High';

  let burnout_risk;
  if (score <= 2) burnout_risk = 'Low Risk';
  else if (score <= 6) burnout_risk = 'Moderate Risk';
  else burnout_risk = 'High Risk';

  return { stress_level, burnout_risk, score };
}

module.exports = router;
