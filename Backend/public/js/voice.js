// ===================================
//   BRAINBALANCE — VOICE INPUT MODULE
//   Web Speech API integration
// ===================================

let isRecording = false;
let recognition = null;

function initVoice() {
  if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = function (event) {
      const transcript = event.results[0][0].transcript;
      processVoiceInput(transcript);
      stopRecording();
    };

    recognition.onerror = function (event) {
      console.warn('Speech recognition error:', event.error);
      const voiceResult = document.getElementById('voiceResult');
      voiceResult.textContent = '❌ Could not understand. Please try again.';
      voiceResult.style.display = 'block';
      stopRecording();
    };

    recognition.onend = function () {
      stopRecording();
    };
  }
}

function toggleVoiceInput() {
  if (!recognition) {
    initVoice();
  }

  if (!recognition) {
    alert('Sorry, voice input is not supported in your browser. Try Chrome!');
    return;
  }

  if (isRecording) {
    recognition.stop();
    stopRecording();
  } else {
    startRecording();
  }
}

function startRecording() {
  isRecording = true;
  const btn = document.getElementById('btnVoice');
  const hint = document.getElementById('voiceHint');
  const result = document.getElementById('voiceResult');
  const icon = document.getElementById('voiceIcon');
  const text = document.getElementById('voiceText');

  btn.classList.add('recording');
  icon.textContent = '⏹️';
  text.textContent = 'Listening...';
  hint.style.display = 'block';
  result.style.display = 'none';

  try {
    recognition.start();
  } catch (e) {
    stopRecording();
  }
}

function stopRecording() {
  isRecording = false;
  const btn = document.getElementById('btnVoice');
  const hint = document.getElementById('voiceHint');
  const icon = document.getElementById('voiceIcon');
  const text = document.getElementById('voiceText');

  btn.classList.remove('recording');
  icon.textContent = '🎙️';
  text.textContent = 'Speak Your Feelings';
  hint.style.display = 'none';
}

function processVoiceInput(transcript) {
  const voiceResult = document.getElementById('voiceResult');
  voiceResult.style.display = 'block';
  voiceResult.textContent = `🎤 Heard: "${transcript}"`;

  const text = transcript.toLowerCase();
  let updated = [];

  // Parse sleep hours
  const sleepMatch = text.match(/slept?\s+(\d+\.?\d*)\s*h/i) ||
                     text.match(/(\d+\.?\d*)\s*hours?\s*(?:of\s+)?sleep/i) ||
                     text.match(/sleep\s+(\d+\.?\d*)/i);
  if (sleepMatch) {
    const val = parseFloat(sleepMatch[1]);
    if (val >= 0 && val <= 12) {
      document.getElementById('sleep').value = val;
      document.getElementById('sleepVal').textContent = val + ' hrs';
      updated.push(`Sleep: ${val}hrs`);
    }
  }

  // Parse work hours
  const workMatch = text.match(/work(?:ed)?\s+(\d+\.?\d*)\s*h/i) ||
                    text.match(/(\d+\.?\d*)\s*hours?\s*(?:of\s+)?work/i);
  if (workMatch) {
    const val = parseFloat(workMatch[1]);
    if (val >= 0 && val <= 16) {
      document.getElementById('work').value = val;
      document.getElementById('workVal').textContent = val + ' hrs';
      updated.push(`Work: ${val}hrs`);
    }
  }

  // Parse screen time
  const screenMatch = text.match(/screen\s*(?:time)?\s+(\d+\.?\d*)\s*h/i) ||
                      text.match(/(\d+\.?\d*)\s*hours?\s*(?:of\s+)?screen/i);
  if (screenMatch) {
    const val = parseFloat(screenMatch[1]);
    if (val >= 0 && val <= 12) {
      document.getElementById('screen').value = val;
      document.getElementById('screenVal').textContent = val + ' hrs';
      updated.push(`Screen: ${val}hrs`);
    }
  }

  // Parse caffeine
  const caffeineMatch = text.match(/(\d+)\s*(?:cups?\s*(?:of\s+)?)?coff/i) ||
                        text.match(/(\d+)\s*(?:cups?\s*(?:of\s+)?)?caffeine/i) ||
                        text.match(/caffeine\s*(\d+)/i);
  if (caffeineMatch) {
    const val = parseInt(caffeineMatch[1]);
    if (val >= 0 && val <= 10) {
      document.getElementById('caffeine').value = val;
      document.getElementById('caffeineVal').textContent = val + ' cups';
      updated.push(`Caffeine: ${val} cups`);
    }
  }

  // Parse mood keywords
  if (text.includes('great') || text.includes('amazing') || text.includes('wonderful')) {
    selectRadio('mood', '5');
    updated.push('Mood: Great');
  } else if (text.includes('good') || text.includes('fine') || text.includes('happy')) {
    selectRadio('mood', '4');
    updated.push('Mood: Good');
  } else if (text.includes('okay') || text.includes('alright') || text.includes('so so')) {
    selectRadio('mood', '3');
    updated.push('Mood: Okay');
  } else if (text.includes('bad') || text.includes('low') || text.includes('sad')) {
    selectRadio('mood', '2');
    updated.push('Mood: Low');
  } else if (text.includes('terrible') || text.includes('awful') || text.includes('horrible') || text.includes('worst')) {
    selectRadio('mood', '1');
    updated.push('Mood: Terrible');
  }

  // Parse exercise
  if (text.includes('exercis') || text.includes('gym') || text.includes('workout') || text.includes('ran') || text.includes('jogged') || text.includes('walked')) {
    selectRadio('exercise', '1');
    updated.push('Exercise: Yes');
  } else if (text.includes('no exercise') || text.includes('didn\'t exercise') || text.includes('sedentary')) {
    selectRadio('exercise', '0');
    updated.push('Exercise: No');
  }

  // Parse stress/feeling keywords
  if (text.includes('stress') || text.includes('overwhelm') || text.includes('burnt out') || text.includes('exhausted')) {
    if (!sleepMatch && !workMatch) {
      voiceResult.textContent += '\n💡 I hear you\'re feeling stressed. Fill in the details and I\'ll analyze!';
    }
  }

  if (updated.length > 0) {
    voiceResult.textContent = `🎤 Updated: ${updated.join(', ')}`;
    voiceResult.style.color = '#2d6a4f';
  } else {
    voiceResult.textContent += '\n💡 Try saying: "I slept 5 hours and worked 12 hours today"';
  }
}

function selectRadio(name, value) {
  const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
  if (radio) {
    // Deselect all in group
    document.querySelectorAll(`input[name="${name}"]`).forEach(r => {
      r.checked = false;
      r.closest('label').classList.remove('selected');
    });
    // Select this one
    radio.checked = true;
    radio.closest('label').classList.add('selected');
  }
}

// Init on load
document.addEventListener('DOMContentLoaded', initVoice);
