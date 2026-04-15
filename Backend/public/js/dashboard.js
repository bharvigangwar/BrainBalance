// ===================================
//   BRAINBALANCE — DASHBOARD MODULE
//   Charts, stats, history rendering
// ===================================

let stressTrendChart = null;
let stressDistChart = null;

async function loadDashboard() {
  if (!currentUser || !authToken) {
    showPage('home');
    return;
  }

  const days = document.getElementById('dashPeriod')?.value || 30;

  try {
    // Fetch stats
    const statsRes = await fetch(`/api/history/stats?days=${days}`, {
      headers: getAuthHeaders()
    });

    if (statsRes.ok) {
      const stats = await statsRes.json();
      renderStats(stats);
      renderCharts(stats);
    }

    // Fetch recent records
    const recordsRes = await fetch('/api/history?limit=10', {
      headers: getAuthHeaders()
    });

    if (recordsRes.ok) {
      const data = await recordsRes.json();
      renderRecords(data.records);
    }

    // Render badges
    renderBadges(currentUser.badges);

  } catch (err) {
    console.warn('Dashboard load error:', err);
  }
}

function renderStats(stats) {
  const s = stats.summary;
  document.getElementById('statTotalAssessments').textContent = s.totalAssessments || 0;
  document.getElementById('statLow').textContent = s.stressDistribution?.Low || 0;
  document.getElementById('statMedium').textContent = s.stressDistribution?.Medium || 0;
  document.getElementById('statHigh').textContent = s.stressDistribution?.High || 0;
  document.getElementById('avgSleep').textContent = s.avgSleep ? s.avgSleep + ' hrs' : '—';
  document.getElementById('avgWork').textContent = s.avgWork ? s.avgWork + ' hrs' : '—';
  document.getElementById('avgScreen').textContent = s.avgScreen ? s.avgScreen + ' hrs' : '—';
}

function renderCharts(stats) {
  const chartData = stats.chartData || [];

  // Destroy old charts
  if (stressTrendChart) stressTrendChart.destroy();
  if (stressDistChart) stressDistChart.destroy();

  // Stress Trend Line Chart
  const trendCtx = document.getElementById('stressTrendChart');
  if (trendCtx && chartData.length > 0) {
    stressTrendChart = new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: chartData.map(d => {
          const date = new Date(d.date);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [{
          label: 'Stress Score',
          data: chartData.map(d => d.avgScore),
          borderColor: '#2d6a4f',
          backgroundColor: 'rgba(45, 106, 79, 0.1)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: chartData.map(d => {
            if (d.dominantStress === 'Low') return '#2d6a4f';
            if (d.dominantStress === 'Medium') return '#e67e22';
            return '#c0392b';
          }),
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `Score: ${ctx.parsed.y.toFixed(1)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Stress Score' },
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          x: {
            grid: { display: false }
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        }
      }
    });
  }

  // Stress Distribution Doughnut
  const distCtx = document.getElementById('stressDistChart');
  const dist = stats.summary.stressDistribution || {};
  if (distCtx) {
    stressDistChart = new Chart(distCtx, {
      type: 'doughnut',
      data: {
        labels: ['Low', 'Medium', 'High'],
        datasets: [{
          data: [dist.Low || 0, dist.Medium || 0, dist.High || 0],
          backgroundColor: ['#d8f3dc', '#fef3e2', '#fdecea'],
          borderColor: ['#2d6a4f', '#e67e22', '#c0392b'],
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 15, font: { size: 12 } }
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        }
      }
    });
  }
}

function renderRecords(records) {
  const tbody = document.getElementById('recordsBody');
  if (!tbody) return;

  if (!records || records.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="no-data">No records yet. Take an assessment!</td></tr>';
    return;
  }

  tbody.innerHTML = records.map(r => {
    const date = new Date(r.createdAt);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const moodEmojis = { 1: '😩', 2: '😟', 3: '😐', 4: '🙂', 5: '😄' };

    return `
      <tr>
        <td>${dateStr}</td>
        <td>${r.inputs.sleep}h</td>
        <td>${r.inputs.work}h</td>
        <td>${moodEmojis[r.inputs.mood] || '😐'} ${r.inputs.mood}/5</td>
        <td><span class="stress-badge ${r.result.stress_level.toLowerCase()}">${r.result.stress_level}</span></td>
        <td>${r.result.burnout_risk}</td>
      </tr>
    `;
  }).join('');
}
