// ===================================
//   BRAINBALANCE — NODE.JS SERVER
//   Serves the frontend and calls
//   the Python ML model via child_process
// ===================================

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process'); // lets Node.js run Python
const path = require('path');

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());

// Parse incoming JSON from the frontend
app.use(express.json());

// Serve all frontend files (HTML, CSS, JS) from this folder
app.use(express.static(path.join(__dirname)));

// Path to Python predict script and Python executable
const PREDICT_SCRIPT = path.join(__dirname, '..', 'model', 'predict.py');
const PYTHON_EXECUTABLE = path.join(__dirname, '..', '.venv', 'Scripts', 'python.exe');

// --- PREDICTION ENDPOINT ---
// The frontend sends user inputs here as JSON
// Node.js passes them to Python and returns the prediction

app.post('/predict', (req, res) => {
  const userInput = req.body;

  // Convert the input object to a JSON string so Python can read it
  const inputJSON = JSON.stringify(userInput);

  console.log('Calling Python script:', PYTHON_EXECUTABLE);
  console.log('Script path:', PREDICT_SCRIPT);
  console.log('Exists:', require('fs').existsSync(PREDICT_SCRIPT));

  // Spawn (run) the Python script, passing the input as a command-line argument
  const python = spawn(PYTHON_EXECUTABLE, [PREDICT_SCRIPT, inputJSON]);

  let output = '';
  let errorOutput = '';

  // Collect output from Python's stdout
  python.stdout.on('data', (data) => {
    output += data.toString();
  });

  // Collect any errors from Python
  python.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  // Log process errors
  python.on('error', (err) => {
    console.error('Process error:', err);
    res.status(500).json({ error: 'Failed to start Python process', detail: err.message });
  });

  // When Python finishes, send the result back to the frontend
  python.on('close', (code) => {
    if (code !== 0) {
      console.error('Python error (code ' + code + '):', errorOutput);
      return res.status(500).json({ error: 'Prediction failed', detail: errorOutput });
    }
    try {
      const result = JSON.parse(output.trim());
      res.json(result);
    } catch (e) {
      console.error('Parse error:', e);
      res.status(500).json({ error: 'Invalid output from model', output: output });
    }
  });
});


// Start the server
app.listen(PORT, () => {
  console.log(`BrainBalance server running at http://localhost:${PORT}`);
});
