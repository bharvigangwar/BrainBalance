// ===================================
//   BRAINBALANCE — CHAT MODULE
//   AI Chat Therapist using Gemini API
// ===================================

let chatHistory = [];
let isChatOpen = false;

function toggleChat() {
  isChatOpen = !isChatOpen;
  document.getElementById('chatPanel').style.display = isChatOpen ? 'flex' : 'none';
  document.getElementById('chatBadge').style.display = 'none';

  if (isChatOpen) {
    document.getElementById('chatInput').focus();
  }
}

function openChat() {
  if (!isChatOpen) toggleChat();
  document.getElementById('chatInput').focus();
}

async function sendChat() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  if (!message) return;

  // Clear input
  input.value = '';

  // Add user message to UI
  addChatMessage('user', message);

  // Add to history
  chatHistory.push({ role: 'user', content: message });

  // Show typing indicator
  document.getElementById('chatTyping').style.display = 'flex';

  try {
    // Build stress context from latest prediction
    let stressContext = null;
    if (lastPrediction && lastInputData) {
      stressContext = {
        ...lastInputData,
        stress_level: lastPrediction.stress_level,
        burnout_risk: lastPrediction.burnout_risk
      };
    }

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        message,
        history: chatHistory.slice(-10), // Send last 10 messages for context
        stressContext
      })
    });

    const data = await res.json();

    // Hide typing
    document.getElementById('chatTyping').style.display = 'none';

    // Add bot reply
    addChatMessage('bot', data.reply);
    chatHistory.push({ role: 'assistant', content: data.reply });

  } catch (err) {
    document.getElementById('chatTyping').style.display = 'none';
    addChatMessage('bot', "I'm having trouble connecting right now. Please try again in a moment. 💙");
  }
}

function addChatMessage(role, content) {
  const container = document.getElementById('chatMessages');
  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-msg ${role}`;

  const contentDiv = document.createElement('div');
  contentDiv.className = 'msg-content';

  // Convert line breaks and basic markdown
  let formatted = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
  contentDiv.innerHTML = formatted;

  msgDiv.appendChild(contentDiv);
  container.appendChild(msgDiv);

  // Auto scroll to bottom
  container.scrollTop = container.scrollHeight;
}
