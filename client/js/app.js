// ===================================
//   BRAINBALANCE — MAIN APP SCRIPT
//   Form handling, results, navigation
// ===================================



// ═══════════════════════════════════════
// STICKY PROGRESS BAR
// ═══════════════════════════════════════
const progressBar = document.getElementById('progressBar');
const tracked = {
  sleep: false, work: false, screen: false,
  mood: false, exercise: false,
  caffeine: false, deadlines: false, social: false
};

function updateProgress() {
  const done = Object.values(tracked).filter(Boolean).length;
  progressBar.style.width = (done / Object.keys(tracked).length * 100) + '%';
}

['sleep', 'work', 'screen', 'caffeine', 'deadlines', 'social'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', () => { tracked[id] = true; updateProgress(); });
});
document.querySelectorAll('input[name="mood"]').forEach(r =>
  r.addEventListener('change', () => { tracked.mood = true; updateProgress(); }));
document.querySelectorAll('input[name="exercise"]').forEach(r =>
  r.addEventListener('change', () => { tracked.exercise = true; updateProgress(); }));

// ═══════════════════════════════════════
// CONFETTI ON LOW STRESS
// ═══════════════════════════════════════
function fireConfetti() {
  confetti({
    particleCount: 130,
    spread: 80,
    origin: { y: 0.6 },
    colors: ['#2d6a4f', '#52b788', '#b7e4c7', '#d8f3dc', '#ffffff']
  });
}



// ═══════════════════════════════════════
// LIVE EMOJI FACE
// ═══════════════════════════════════════
function updateEmoji() {
  const sleep     = parseFloat(document.getElementById('sleep').value);
  const work      = parseFloat(document.getElementById('work').value);
  const screen    = parseFloat(document.getElementById('screen').value);
  const moodEl    = document.querySelector('input[name="mood"]:checked');
  const mood      = moodEl ? parseInt(moodEl.value) : 3;
  const deadlines = parseInt(document.getElementById('deadlines').value);

  let score = 0;
  score += sleep     >= 7  ? 2 : sleep     >= 5 ? 1 : 0;
  score += work      <= 8  ? 2 : work      <= 11 ? 1 : 0;
  score += screen    <= 3  ? 2 : screen    <= 6  ? 1 : 0;
  score += mood      >= 4  ? 2 : mood      === 3 ? 1 : 0;
  score += deadlines <= 4  ? 2 : deadlines <= 6  ? 1 : 0;

  const emoji = score >= 8 ? '😄'
              : score >= 6 ? '🙂'
              : score >= 4 ? '😐'
              : score >= 2 ? '😟'
              : '😩';

  const el = document.getElementById('liveEmoji');
  if (el && el.textContent !== emoji) {
    el.style.transform = 'scale(1.3)';
    setTimeout(() => {
      el.textContent = emoji;
      el.style.transform = 'scale(1)';
    }, 150);
  }
}

// Attach emoji listeners to all inputs
['sleep', 'work', 'screen', 'caffeine', 'deadlines', 'social'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', updateEmoji);
});
document.querySelectorAll('input[name="mood"]').forEach(r =>
  r.addEventListener('change', updateEmoji));



// Last prediction data (used by chat, report, plan)
let lastPrediction = null;
let lastInputData = null;

// --- PAGE NAVIGATION ---
function showPage(page) {
  document.getElementById('homePage').style.display = page === 'home' ? 'block' : 'none';
  document.getElementById('dashboardPage').style.display = page === 'dashboard' ? 'block' : 'none';

  // Update nav active state
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const activeLink = document.querySelector(`.nav-link[data-page="${page}"]`);
  if (activeLink) activeLink.classList.add('active');

  if (page === 'dashboard' && currentUser) {
    loadDashboard();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- SLIDER LIVE UPDATES ---
const sliders = [
  { id: 'sleep',     valId: 'sleepVal',     suffix: ' hrs' },
  { id: 'work',      valId: 'workVal',      suffix: ' hrs' },
  { id: 'screen',    valId: 'screenVal',    suffix: ' hrs' },
  { id: 'caffeine',  valId: 'caffeineVal',  suffix: ' cups' },
  { id: 'deadlines', valId: 'deadlinesVal', suffix: '/10' },
  { id: 'social',    valId: 'socialVal',    suffix: ' hrs' },
];

sliders.forEach(s => {
  const el = document.getElementById(s.id);
  if (el) {
    el.addEventListener('input', function () {
      document.getElementById(s.valId).textContent = this.value + s.suffix;
    });
  }
});

// --- MOOD / TOGGLE CHIP HIGHLIGHT ---
document.querySelectorAll('.mood-chip, .toggle-chip').forEach(chip => {
  chip.addEventListener('click', function () {
    const name = this.querySelector('input').name;
    document.querySelectorAll(`input[name="${name}"]`).forEach(input => {
      input.closest('label').classList.remove('selected');
    });
    this.classList.add('selected');
  });
});

// --- FORM SUBMISSION ---
document.getElementById('stressForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const data = {
    sleep:        parseFloat(document.getElementById('sleep').value),
    work:         parseFloat(document.getElementById('work').value),
    screen:       parseFloat(document.getElementById('screen').value),
    mood:         parseInt(document.querySelector('input[name="mood"]:checked').value),
    exercise:     parseInt(document.querySelector('input[name="exercise"]:checked').value),
    caffeine:     parseInt(document.getElementById('caffeine').value),
    deadlines:    parseInt(document.getElementById('deadlines').value),
    social:       parseFloat(document.getElementById('social').value),
    sleepQuality: parseInt(document.querySelector('input[name="sleepQuality"]:checked').value)
  };

  lastInputData = data;

  const btn = document.getElementById('btnSubmit');
  btn.textContent = 'Analysing with AI…';
  btn.disabled = true;

  try {
    const response = await fetch('/api/predict', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    const result = await response.json();
    lastPrediction = result;
    showResults(result);
  } catch (error) {
    console.warn('Server not available, using local prediction.');
    const result = localPredict(data);
    lastPrediction = result;
    showResults(result);
  }

  btn.textContent = 'Analyse My Balance →';
  btn.disabled = false;
});

// --- SHOW RESULTS ---
function showResults(result) {
  const stressLevel = result.stress_level;
  const burnoutRisk = result.burnout_risk;

  // Update result values
  document.getElementById('stressLevel').textContent = stressLevel;
  document.getElementById('burnoutRisk').textContent = burnoutRisk;

  // Flip and color stress card
  const stressCardBack = document.getElementById('stressCardBack');
  stressCardBack.className = 'flip-card-back ' + stressLevel.toLowerCase();

  // Flip and color burnout card
  const burnoutCardBack = document.getElementById('burnoutCardBack');
  burnoutCardBack.className = 'flip-card-back';
  if (burnoutRisk.includes('Low')) burnoutCardBack.classList.add('low');
  else if (burnoutRisk.includes('Moderate')) burnoutCardBack.classList.add('medium');
  else burnoutCardBack.classList.add('high');

  

  // Show recommendations
  const recList = document.getElementById('recommendationsList');
  recList.innerHTML = '';
  if (result.recommendations && result.recommendations.length > 0) {
    result.recommendations.forEach(tip => {
      const li = document.createElement('li');
      li.textContent = tip;
      recList.appendChild(li);
    });
  } else {
    // Fallback advice
    const li = document.createElement('li');
    li.textContent = getAdvice(stressLevel);
    recList.appendChild(li);
  }

  // Show XP if logged in
  const xpCard = document.getElementById('xpCard');
  if (result.xpEarned) {
    document.getElementById('xpEarned').textContent = `+${result.xpEarned}`;
    xpCard.style.display = 'block';
  } else {
    xpCard.style.display = 'none';
  }

  // Show new badges
  const newBadgesBox = document.getElementById('newBadgesBox');
  const newBadgesRow = document.getElementById('newBadgesRow');
  if (result.gamification && result.gamification.newBadges && result.gamification.newBadges.length > 0) {
    newBadgesRow.innerHTML = '';
    result.gamification.newBadges.forEach(badge => {
      const div = document.createElement('div');
      div.className = 'badge-item';
      div.innerHTML = `<span class="badge-icon">${badge.icon}</span> ${badge.name}`;
      newBadgesRow.appendChild(div);
    });
    newBadgesBox.style.display = 'block';
  } else {
    newBadgesBox.style.display = 'none';
  }

  // Update nav XP if gamification data
  if (result.gamification) {
    document.getElementById('navXP').textContent = `${result.gamification.xp} XP`;
    document.getElementById('navLevel').textContent = `Lv ${result.gamification.level}`;
    document.getElementById('navStreak').textContent = `🔥 ${result.gamification.streak?.current || 0}`;
    // Update stored user
    if (currentUser) {
      currentUser.xp = result.gamification.xp;
      currentUser.level = result.gamification.level;
      currentUser.badges = result.gamification.badges;
      currentUser.streak = result.gamification.streak;
      localStorage.setItem('bb_user', JSON.stringify(currentUser));
    }
  }

  // Show alert banner for high stress
  showAlertBanner(stressLevel);

// Show and scroll
  const resultSection = document.getElementById('resultSection');
  resultSection.style.display = 'block';
  resultSection.scrollIntoView({ behavior: 'smooth' });

  // Confetti for low stress
  if (stressLevel === 'Low') fireConfetti();

  // Fill progress bar to 100% on submit
  progressBar.style.width = '100%';

  

  // Trigger flips with stagger AFTER section is visible
  setTimeout(() => document.getElementById('stressCard').classList.add('flipped'), 300);
  setTimeout(() => document.getElementById('burnoutCard').classList.add('flipped'), 600);
  if (result.xpEarned) {
    setTimeout(() => document.getElementById('xpCardInner').classList.add('flipped'), 900);
  }



  // Request notification permission for future alerts
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // Browser notification for high stress
  if (stressLevel === 'High' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification('⚠️ BrainBalance Alert', {
      body: 'High stress detected! Take a break and try a breathing exercise.',
      icon: '🧠'
    });
  }
}

// --- ALERT BANNER ---
function showAlertBanner(stressLevel) {
  const banner = document.getElementById('alertBanner');
  const alertIcon = document.getElementById('alertIcon');
  const alertTitle = document.getElementById('alertTitle');
  const alertText = document.getElementById('alertText');

  if (stressLevel === 'High') {
    banner.className = 'alert-banner alert-high';
    alertIcon.textContent = '🚨';
    alertTitle.textContent = 'High Stress Detected!';
    alertText.textContent = 'You need a break now. Try a breathing exercise or step away from screens.';
    banner.style.display = 'flex';
  } else if (stressLevel === 'Medium') {
    banner.className = 'alert-banner alert-medium';
    alertIcon.textContent = '⚠️';
    alertTitle.textContent = 'Moderate Stress Detected';
    alertText.textContent = 'Consider taking short breaks and limiting screen time today.';
    banner.style.display = 'flex';
  } else {
    banner.style.display = 'none';
  }
}

// --- BREATHING EXERCISE ---
function startBreathing() {
  document.getElementById('breathingModal').style.display = 'flex';
}
function closeBreathing() {
  document.getElementById('breathingModal').style.display = 'none';
}
async function runBreathing() {
  const circle = document.getElementById('breathingCircle');
  const text = document.getElementById('breathingText');
  const btn = document.getElementById('btnStartBreathing');
  btn.disabled = true;
  btn.textContent = 'In progress...';

  for (let i = 0; i < 4; i++) {
    // Inhale
    circle.className = 'breathing-circle inhale';
    text.textContent = 'Inhale...';
    await sleep(4000);
    // Hold
    circle.className = 'breathing-circle hold';
    text.textContent = 'Hold...';
    await sleep(4000);
    // Exhale
    circle.className = 'breathing-circle exhale';
    text.textContent = 'Exhale...';
    await sleep(4000);
    // Hold
    circle.className = 'breathing-circle';
    text.textContent = 'Hold...';
    await sleep(4000);
  }

  text.textContent = 'Great job! 🌟';
  circle.className = 'breathing-circle';
  btn.disabled = false;
  btn.textContent = 'Start Again';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// --- GENERATE DAILY PLAN ---
async function generatePlan() {
  const planBox = document.getElementById('planBox');
  const planContent = document.getElementById('planContent');
  planBox.style.display = 'block';
  planContent.textContent = 'Generating your personalized plan... ⏳';

  try {
    const stressData = {
      ...lastInputData,
      stress_level: lastPrediction?.stress_level || 'Medium',
      burnout_risk: lastPrediction?.burnout_risk || 'Moderate Risk'
    };

    const res = await fetch('/api/chat/plan', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ stressData })
    });
    const data = await res.json();
    planContent.textContent = data.plan;
  } catch (err) {
    planContent.textContent = getFallbackPlan();
  }

  planBox.scrollIntoView({ behavior: 'smooth' });
}

function getFallbackPlan() {
  return `🌅 Your Personalized Stress-Free Plan\n\n⏰ 7:00 AM — Wake up, drink water 💧\n🧘 7:15 AM — 10-min morning stretch\n🍳 7:30 AM — Healthy breakfast\n💻 9:00 AM — Focused work (90 min)\n☕ 10:30 AM — Break + healthy snack\n💻 11:00 AM — Work block #2\n🍽️ 12:30 PM — Lunch + 15 min walk 🌿\n💻 1:30 PM — Lighter tasks\n🏃 3:30 PM — 30 min exercise\n👥 5:00 PM — Social time\n🍲 6:30 PM — Dinner\n📖 7:30 PM — Screen-free time\n🌙 9:00 PM — Wind-down routine\n😴 10:00 PM — Sleep (7-8 hrs)`;
}

// --- DOWNLOAD PDF REPORT ---
async function downloadReport() {
  if (!lastPrediction || !lastInputData) {
    alert('Please complete an assessment first!');
    return;
  }

  try {
    const res = await fetch('/api/report/generate', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        inputs: lastInputData,
        result: {
          stress_level: lastPrediction.stress_level,
          burnout_risk: lastPrediction.burnout_risk
        },
        recommendations: lastPrediction.recommendations || []
      })
    });

    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'BrainBalance_Report.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert('Failed to generate report. Please try again.');
    }
  } catch (err) {
    alert('Could not connect to server for PDF generation.');
  }
}

// --- ADVICE FALLBACK ---
function getAdvice(level) {
  if (level === 'Low') {
    return "You're doing great! Keep your healthy habits going — good sleep and regular breaks are your best friends.";
  } else if (level === 'Medium') {
    return "Moderate stress detected. Consider taking short breaks, limiting screen time, and getting at least 7 hours of sleep tonight.";
  } else {
    return "High stress detected. Please take this seriously — rest, disconnect from screens, talk to someone you trust, and avoid overworking yourself.";
  }
}

// --- LOCAL PREDICTION FALLBACK ---
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

  if (data.caffeine > 4) score += 2;
  else if (data.caffeine > 2) score += 1;

  if (data.deadlines >= 8) score += 2;
  else if (data.deadlines >= 5) score += 1;

  if (data.social < 1) score += 1;

  if (data.sleepQuality <= 2) score += 2;
  else if (data.sleepQuality <= 3) score += 1;

  let stress_level;
  if (score <= 3) stress_level = 'Low';
  else if (score <= 7) stress_level = 'Medium';
  else stress_level = 'High';

  let burnout_risk;
  if (score <= 2) burnout_risk = 'Low Risk';
  else if (score <= 6) burnout_risk = 'Moderate Risk';
  else burnout_risk = 'High Risk';

  // Generate local recommendations
  const recommendations = [];
  if (data.sleep < 5) recommendations.push("🛌 Critical: You slept less than 5 hours! Aim for 7–8 hours tonight.");
  if (data.work > 10) recommendations.push("⚠️ Working 12+ hours is unsustainable. Take breaks.");
  if (data.screen > 6) recommendations.push("📱 High screen time! Try the 20-20-20 rule.");
  if (data.mood <= 2) recommendations.push("💙 Low mood. Talk to someone you trust today.");
  if (data.exercise === 0) recommendations.push("🏃 No exercise! Even a 15-min walk reduces stress.");
  if (data.caffeine > 4) recommendations.push("☕ Too much caffeine! Switch to water after 2 PM.");

  return { stress_level, burnout_risk, score, recommendations };
}

// --- RESET FORM ---
function resetForm() {
  document.getElementById('resultSection').style.display = 'none';
  document.getElementById('stressForm').reset();

  // Reset slider labels
  document.getElementById('sleepVal').textContent = '7 hrs';
  document.getElementById('workVal').textContent = '8 hrs';
  document.getElementById('screenVal').textContent = '3 hrs';
  document.getElementById('caffeineVal').textContent = '2 cups';
  document.getElementById('deadlinesVal').textContent = '5/10';
  document.getElementById('socialVal').textContent = '2 hrs';

  // Reset chip highlights
  document.querySelectorAll('.mood-chip, .toggle-chip').forEach(c => c.classList.remove('selected'));

  // Re-select defaults
  document.querySelectorAll('input[name="mood"][value="3"]').forEach(el => {
    el.checked = true;
    el.closest('label').classList.add('selected');
  });
  document.querySelectorAll('input[name="exercise"][value="1"]').forEach(el => {
    el.checked = true;
    el.closest('label').classList.add('selected');
  });
  document.querySelectorAll('input[name="sleepQuality"][value="3"]').forEach(el => {
    el.checked = true;
    el.closest('label').classList.add('selected');
  });

  // Reset plan and badges
  // Reset card flips
  document.getElementById('stressCard').classList.remove('flipped');
  document.getElementById('burnoutCard').classList.remove('flipped');
  document.getElementById('planBox').style.display = 'none';
  document.getElementById('newBadgesBox').style.display = 'none';
  document.getElementById('alertBanner').style.display = 'none';

  document.getElementById('form-section').scrollIntoView({ behavior: 'smooth' });
}
