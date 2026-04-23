// ===================================
//   BRAINBALANCE — GAMIFICATION MODULE
//   XP, Badges, Streaks display
// ===================================

// Badge definitions
const ALL_BADGES = [
  { id: 'first_signup',      name: 'Welcome Aboard',     icon: '🎉', desc: 'Created your account' },
  { id: 'first_checkin',     name: 'First Check-in',     icon: '🌱', desc: 'Completed first assessment' },
  { id: 'five_checkins',     name: 'Consistent Tracker', icon: '📊', desc: 'Completed 5 assessments' },
  { id: 'ten_checkins',      name: 'Dedicated User',     icon: '🏆', desc: 'Completed 10 assessments' },
  { id: 'healthy_streak',    name: 'Healthy Streak',     icon: '💪', desc: '3 consecutive Low stress' },
  { id: 'balanced_life',     name: 'Balanced Life',      icon: '⭐', desc: '5 consecutive Low stress' },
  { id: 'three_day_streak',  name: '3-Day Streak',       icon: '🔥', desc: 'Checked in 3 days in a row' },
  { id: 'mindful_week',      name: 'Mindful Week',       icon: '🧘', desc: 'Checked in 7 days in a row' }
];

// Render badges in dashboard
function renderBadges(userBadges) {
  const grid = document.getElementById('badgesGrid');
  if (!grid) return;

  if (!userBadges || userBadges.length === 0) {
    grid.innerHTML = '<p class="no-badges">Complete assessments to earn badges!</p>';
    return;
  }

  const earnedIds = userBadges.map(b => b.id);

  grid.innerHTML = ALL_BADGES.map(badge => {
    const earned = earnedIds.includes(badge.id);
    return `
      <div class="badge-item ${earned ? '' : 'badge-locked'}" title="${badge.desc}">
        <span class="badge-icon">${earned ? badge.icon : '🔒'}</span>
        <span>${badge.name}</span>
      </div>
    `;
  }).join('');
}

// Calculate level from XP
function getLevel(xp) {
  return Math.floor(xp / 100) + 1;
}

// Get XP progress to next level
function getXPProgress(xp) {
  return xp % 100;
}
