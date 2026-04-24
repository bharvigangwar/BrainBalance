// ===================================
//   BRAINBALANCE — AUTH MODULE
//   Login, Signup, Session Management
// ===================================

// Auth state
let currentUser = null;
let authToken = null;
let authMode = 'login'; // 'login' or 'signup'

// Initialize auth from localStorage
function initAuth() {
  const savedToken = localStorage.getItem('bb_token');
  const savedUser = localStorage.getItem('bb_user');
  if (savedToken && savedUser) {
    authToken = savedToken;
    currentUser = JSON.parse(savedUser);
    updateAuthUI(true);
    // Verify token is still valid
    verifyToken();
  }
}

async function verifyToken() {
  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (res.ok) {
      const userData = await res.json();
      currentUser = userData;
      localStorage.setItem('bb_user', JSON.stringify(currentUser));
      updateAuthUI(true);
    } else {
      logout();
    }
  } catch (e) {
    // Keep logged in state even if server unreachable
    console.warn('Could not verify token:', e.message);
  }
}

function updateAuthUI(loggedIn) {
  const navAuth = document.getElementById('navAuth');
  const navUser = document.getElementById('navUser');
  const navDashboard = document.getElementById('navDashboard');

  if (loggedIn && currentUser) {
    navAuth.style.display = 'none';
    navUser.style.display = 'flex';
    navDashboard.style.display = 'inline';
    document.getElementById('navUserName').textContent = currentUser.name || 'User';
    document.getElementById('navLevel').textContent = `Lv ${currentUser.level || 1}`;
    document.getElementById('navXP').textContent = `${currentUser.xp || 0} XP`;
    document.getElementById('navStreak').textContent = `🔥 ${currentUser.streak?.current || 0}`;
  } else {
    navAuth.style.display = 'flex';
    navUser.style.display = 'none';
    navDashboard.style.display = 'none';
  }
}

function openAuthModal(mode) {
  authMode = mode;
  const modal = document.getElementById('authModal');
  const title = document.getElementById('authModalTitle');
  const subtitle = document.getElementById('authModalSubtitle');
  const nameGroup = document.getElementById('authNameGroup');
  const submitBtn = document.getElementById('authSubmitBtn');
  const toggleText = document.getElementById('authToggleText');
  const toggleLink = document.getElementById('authToggleLink');
  const error = document.getElementById('authError');

  error.style.display = 'none';

  if (mode === 'signup') {
    title.textContent = 'Create Account';
    subtitle.textContent = 'Join BrainBalance and track your wellness';
    nameGroup.style.display = 'block';
    submitBtn.textContent = 'Sign Up';
    toggleText.textContent = 'Already have an account?';
    toggleLink.textContent = 'Log In';
  } else {
    title.textContent = 'Log In';
    subtitle.textContent = 'Welcome back to BrainBalance';
    nameGroup.style.display = 'none';
    submitBtn.textContent = 'Log In';
    toggleText.textContent = "Don't have an account?";
    toggleLink.textContent = 'Sign Up';
  }

  modal.style.display = 'flex';
}

function closeAuthModal() {
  document.getElementById('authModal').style.display = 'none';
  document.getElementById('authForm').reset();
  document.getElementById('authError').style.display = 'none';
}

function toggleAuthMode(e) {
  e.preventDefault();
  openAuthModal(authMode === 'login' ? 'signup' : 'login');
}

async function handleAuth(e) {
  e.preventDefault();
  const error = document.getElementById('authError');
  const submitBtn = document.getElementById('authSubmitBtn');
  error.style.display = 'none';

  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const name = document.getElementById('authName')?.value?.trim();

  if (!email || !password) {
    error.textContent = 'Please fill in all fields';
    error.style.display = 'block';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = authMode === 'login' ? 'Logging in...' : 'Creating account...';

  try {
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    const body = authMode === 'signup' ? { name, email, password } : { email, password };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      error.textContent = data.error || 'Something went wrong';
      error.style.display = 'block';
      return;
    }

    // Save auth
    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem('bb_token', authToken);
    localStorage.setItem('bb_user', JSON.stringify(currentUser));

    updateAuthUI(true);
    closeAuthModal();

  } catch (err) {
    error.textContent = 'Could not connect to server. Is it running?';
    error.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = authMode === 'login' ? 'Log In' : 'Sign Up';
  }
}

function logout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('bb_token');
  localStorage.removeItem('bb_user');
  updateAuthUI(false);
  showPage('home');
}

// Get auth headers for API calls
function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
}

// Init on page load
document.addEventListener('DOMContentLoaded', initAuth);
