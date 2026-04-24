// ===================================
//   BRAINBALANCE — AI CHAT ROUTES
//   AI Therapist + Daily Plan Generator
//   Uses Google Gemini API
// ===================================

const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// System prompt for therapeutic AI
const THERAPIST_SYSTEM_PROMPT = `You are BrainBalance AI Assistant — a caring, empathetic mental wellness companion. 

RULES:
1. You are NOT a licensed therapist or doctor. Always remind users of this if they share serious concerns.
2. Be warm, understanding, and non-judgmental.
3. Offer practical coping strategies: breathing exercises, journaling prompts, mindfulness tips.
4. If someone mentions self-harm, suicidal thoughts, or crisis, IMMEDIATELY provide:
   - National Suicide Prevention Lifeline: 988 (US) or local helpline
   - Crisis Text Line: Text HOME to 741741
   - Say "Please reach out to a professional — you matter."
5. Keep responses concise (2-4 paragraphs max).
6. Use a gentle, conversational tone with occasional emojis.
7. Reference their stress data if provided in context.
8. Suggest specific actions they can take RIGHT NOW.

DISCLAIMER: Always end your first message with:
"💡 I'm an AI companion, not a therapist. For professional help, please reach out to a licensed counselor."`;

// ── POST /api/chat ──
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { message, history, stressContext } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      return res.json({
        reply: getFallbackReply(message),
        source: 'fallback'
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Build context with stress data if available
    let contextMessage = THERAPIST_SYSTEM_PROMPT;
    if (stressContext) {
      contextMessage += `\n\nUser's latest stress data: Sleep: ${stressContext.sleep}hrs, Work: ${stressContext.work}hrs, Screen: ${stressContext.screen}hrs, Mood: ${stressContext.mood}/5, Exercise: ${stressContext.exercise ? 'Yes' : 'No'}, Stress Level: ${stressContext.stress_level}, Burnout Risk: ${stressContext.burnout_risk}`;
    }

    // Build chat history
    const chatHistory = [];
    if (history && Array.isArray(history)) {
      history.forEach(msg => {
        chatHistory.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });
    }

    const chat = model.startChat({
      history: chatHistory,
      systemInstruction: contextMessage
    });

    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    res.json({ reply, source: 'gemini' });

  } catch (error) {
    console.error('Chat error:', error);
    res.json({
      reply: getFallbackReply(req.body.message),
      source: 'fallback'
    });
  }
});

// ── POST /api/chat/plan ──
// Generate personalized daily stress-free plan
router.post('/plan', optionalAuth, async (req, res) => {
  try {
    const { stressData } = req.body;

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      return res.json({ plan: getFallbackPlan(stressData), source: 'fallback' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const planPrompt = `Based on this user's stress assessment data, generate a personalized daily stress-free plan for tomorrow.

User Data:
- Sleep: ${stressData?.sleep || 7} hours
- Work: ${stressData?.work || 8} hours  
- Screen Time: ${stressData?.screen || 3} hours
- Mood: ${stressData?.mood || 3}/5
- Exercise: ${stressData?.exercise ? 'Yes' : 'No'}
- Caffeine: ${stressData?.caffeine || 0} cups
- Deadline Pressure: ${stressData?.deadlines || 5}/10
- Social Time: ${stressData?.social || 1} hours
- Sleep Quality: ${stressData?.sleepQuality || 3}/5
- Stress Level: ${stressData?.stress_level || 'Medium'}
- Burnout Risk: ${stressData?.burnout_risk || 'Moderate Risk'}

Generate a realistic, hour-by-hour daily plan that:
1. Addresses their specific weak areas
2. Includes specific times (like "7:00 AM - Wake up")
3. Includes exercise, breaks, meals, social time, and wind-down routine
4. Is practical and achievable (not overly ambitious)
5. Includes 2-3 specific wellness activities matched to their stress level
6. Use emojis for each activity

Format the plan as a simple list with times and activities. Keep it to 12-15 items max.`;

    const result = await model.generateContent(planPrompt);
    const plan = result.response.text();

    res.json({ plan, source: 'gemini' });

  } catch (error) {
    console.error('Plan generation error:', error);
    res.json({ plan: getFallbackPlan(req.body.stressData), source: 'fallback' });
  }
});


// ── Fallback responses when API is unavailable ──
function getFallbackReply(message) {
  const msg = (message || '').toLowerCase();

  if (msg.includes('stress') || msg.includes('overwhelm')) {
    return "I hear you — feeling stressed can be really overwhelming. 💙\n\nHere are some things that might help right now:\n\n1. **Box Breathing**: Inhale 4 seconds → Hold 4 seconds → Exhale 4 seconds → Hold 4 seconds. Repeat 4 times.\n2. **5-4-3-2-1 Grounding**: Name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste.\n3. **Step away** from screens for 10 minutes.\n\nYou're taking a great step by checking in with yourself! 🌟\n\n💡 I'm an AI companion, not a therapist. For professional help, please reach out to a licensed counselor.";
  }

  if (msg.includes('sleep') || msg.includes('tired') || msg.includes('insomnia')) {
    return "Sleep is absolutely crucial for mental health. 😴\n\nHere's a science-backed wind-down routine:\n\n1. **2 hours before bed**: Dim lights, no heavy meals\n2. **1 hour before**: No screens (use blue light filter if you must)\n3. **30 min before**: Light stretching or reading\n4. **At bedtime**: Keep room cool (65-68°F), try progressive muscle relaxation\n\nConsistency matters most — try to sleep and wake at the same time daily. 🌙\n\n💡 I'm an AI companion, not a therapist. For professional help, please reach out to a licensed counselor.";
  }

  if (msg.includes('anxiety') || msg.includes('anxious') || msg.includes('worried')) {
    return "Anxiety is your brain trying to protect you — but sometimes it overdoes it. 🫂\n\nTry this right now:\n\n1. **Slow your breathing**: 4 seconds in, 6 seconds out\n2. **Challenge the thought**: \"What evidence do I actually have for this worry?\"\n3. **Move your body**: Even standing up and stretching helps\n4. **Write it down**: Journaling reduces anxious thoughts by 40%\n\nYou're not alone in this. 💪\n\n💡 I'm an AI companion, not a therapist. For professional help, please reach out to a licensed counselor.";
  }

  if (msg.includes('sad') || msg.includes('depress') || msg.includes('unhappy') || msg.includes('lonely')) {
    return "I'm sorry you're feeling this way. Your feelings are valid. 💙\n\nSmall steps that can help:\n\n1. **Reach out** to one person today — even a text counts\n2. **Get outside** for 10 minutes — sunlight boosts serotonin\n3. **Do one thing** you used to enjoy, even if you don't feel like it\n4. **Be kind to yourself** — you're going through something tough\n\nIf these feelings persist, please talk to a professional. You deserve support. 🌟\n\n💡 I'm an AI companion, not a therapist. For professional help, please reach out to a licensed counselor.";
  }

  return "Hi there! I'm your BrainBalance AI companion. 🧠✨\n\nI'm here to help you manage stress and talk through what you're feeling. You can tell me about:\n\n• How you're feeling right now\n• Stress or anxiety you're experiencing\n• Sleep problems\n• Work-life balance concerns\n\nWhat's on your mind? 💙\n\n💡 I'm an AI companion, not a therapist. For professional help, please reach out to a licensed counselor.";
}

function getFallbackPlan(data) {
  return `🌅 **Your Personalized Stress-Free Plan**

⏰ 7:00 AM — Wake up, drink a glass of water 💧
🧘 7:15 AM — 10-minute morning stretch or yoga
🍳 7:30 AM — Healthy breakfast (oatmeal, fruits, green tea)
📋 8:30 AM — Plan your top 3 priorities for the day
💻 9:00 AM — Focused work block #1 (90 minutes)
☕ 10:30 AM — Short break + healthy snack (limit to 1 coffee)
💻 11:00 AM — Focused work block #2 (90 minutes)
🍽️ 12:30 PM — Lunch break + 15 min walk outside 🌿
💻 1:30 PM — Work block #3 (lighter tasks)
🏃 3:30 PM — 30 min exercise (walk, gym, or home workout)
👥 5:00 PM — Social time: call a friend or hang out
🍲 6:30 PM — Dinner (home-cooked, no heavy meals)
📖 7:30 PM — Screen-free time: read, sketch, or journal
🌙 9:00 PM — Wind-down: dim lights, light stretching
😴 10:00 PM — Sleep time (aim for 7-8 hours)

💡 *Focus on reducing screen time and getting quality sleep tonight!*`;
}

module.exports = router;
