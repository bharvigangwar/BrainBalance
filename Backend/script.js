// ===================================
//   BRAINBALANCE — FRONTEND SCRIPT
//   Handles sliders, form, and results
// ===================================

// --- SLIDER LIVE UPDATES ---
// When the user drags a slider, update the displayed value next to it

document.getElementById('sleep').addEventListener('input', function () {
  document.getElementById('sleepVal').textContent = this.value + ' hrs';
});

document.getElementById('work').addEventListener('input', function () {
  document.getElementById('workVal').textContent = this.value + ' hrs';
});

document.getElementById('screen').addEventListener('input', function () {
  document.getElementById('screenVal').textContent = this.value + ' hrs';
});


// --- MOOD / TOGGLE CHIP HIGHLIGHT ---
// Add a "selected" class to the chosen chip for styling

document.querySelectorAll('.mood-chip, .toggle-chip').forEach(chip => {
  chip.addEventListener('click', function () {
    // Find all chips in the same group and remove selected
    const name = this.querySelector('input').name;
    document.querySelectorAll(`input[name="${name}"]`).forEach(input => {
      input.closest('label').classList.remove('selected');
    });
    // Mark this one as selected
    this.classList.add('selected');
  });
});


// --- FORM SUBMISSION ---
// Collect inputs, send to the Node.js backend, display results

document.getElementById('stressForm').addEventListener('submit', async function (e) {
  e.preventDefault(); // stop the page from refreshing

  // Collect all values
  const data = {
    sleep:    parseFloat(document.getElementById('sleep').value),
    work:     parseFloat(document.getElementById('work').value),
    screen:   parseFloat(document.getElementById('screen').value),
    mood:     parseInt(document.querySelector('input[name="mood"]:checked').value),
    exercise: parseInt(document.querySelector('input[name="exercise"]:checked').value)
  };

  // Show a loading state on the button
  const btn = document.querySelector('.btn-submit');
  btn.textContent = 'Analysing…';
  btn.disabled = true;

  try {
    // Send data to the backend API
    const response = await fetch('/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    showResults(result);

  } catch (error) {
    // If the server is not running, use the local prediction fallback
    console.warn('Server not available, using local prediction.');
    const result = localPredict(data);
    showResults(result);
  }

  // Reset button
  btn.textContent = 'Analyse My Balance →';
  btn.disabled = false;
});


// --- SHOW RESULTS ---
// Populate the result section and scroll to it

function showResults(result) {
  const stressLevel = result.stress_level;   // "Low", "Medium", or "High"
  const burnoutRisk = result.burnout_risk;   // "Low Risk", "Moderate Risk", "High Risk"

  // Update text
  document.getElementById('stressLevel').textContent = stressLevel;
  document.getElementById('burnoutRisk').textContent = burnoutRisk;

  // Colour the stress card based on level
  const stressCard = document.getElementById('stressCard');
  stressCard.className = 'result-card';  // reset
  stressCard.classList.add(stressLevel.toLowerCase());

  // Show personalised advice
  document.getElementById('resultAdvice').textContent = getAdvice(stressLevel);

  // Show the result section and scroll to it
  document.getElementById('resultSection').style.display = 'block';
  document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth' });
}


// --- ADVICE MESSAGES ---
// Simple tips based on the predicted stress level

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
// This mirrors the Python ML logic in simple rules.
// Used when the Node.js server is offline (e.g., during frontend-only demo).

function localPredict(data) {
  // Simple rule-based scoring (mirrors the Python model's feature logic)
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

  // Determine stress level
  let stress_level;
  if (score <= 3) stress_level = 'Low';
  else if (score <= 6) stress_level = 'Medium';
  else stress_level = 'High';

  // Burnout risk is generally one step worse than stress
  let burnout_risk;
  if (score <= 2) burnout_risk = 'Low Risk';
  else if (score <= 5) burnout_risk = 'Moderate Risk';
  else burnout_risk = 'High Risk';

  return { stress_level, burnout_risk };
}


// --- RESET FORM ---
// Called by the "Try Again" button

function resetForm() {
  document.getElementById('resultSection').style.display = 'none';
  document.getElementById('stressForm').reset();

  // Reset slider labels
  document.getElementById('sleepVal').textContent = '7 hrs';
  document.getElementById('workVal').textContent  = '8 hrs';
  document.getElementById('screenVal').textContent = '3 hrs';

  // Reset chip highlights
  document.querySelectorAll('.mood-chip, .toggle-chip').forEach(c => c.classList.remove('selected'));

  // Scroll back to form
  document.getElementById('form-section').scrollIntoView({ behavior: 'smooth' });
}
