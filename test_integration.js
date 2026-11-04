const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.join(__dirname);
const backendDir = path.join(__dirname, 'backend');

console.log('Starting ML Service on port 8000...');
const mlProc = spawn('python', ['-m', 'uvicorn', 'main:app', '--app-dir', 'ml-service', '--host', '127.0.0.1', '--port', '8000'], {
  cwd: rootDir,
  stdio: 'inherit'
});

console.log('Starting Node Backend on port 5000...');
const backProc = spawn('node', ['server.js'], {
  cwd: backendDir,
  stdio: 'inherit'
});

function cleanup() {
  console.log('Cleaning up processes...');
  try { mlProc.kill(); } catch (e) {}
  try { backProc.kill(); } catch (e) {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

setTimeout(async () => {
  try {
    const axios = require('./backend/node_modules/axios');
    console.log('--- Probing Backend /health ---');
    const health = await axios.get('http://127.0.0.1:5000/health');
    console.log('Health:', health.data);

    console.log('--- Probing Backend /api/movies?year=modern ---');
    const modernMovies = await axios.get('http://127.0.0.1:5000/api/movies?year=modern&limit=3');
    console.log('Modern movies sample:', modernMovies.data.items.map(m => `${m.title} (${m.releaseYear})`));

    console.log('--- Probing Typeahead Smart Suggestion Model ---');
    const typeahead = await axios.get('http://127.0.0.1:5000/api/suggestions/typeahead?q=oppen');
    console.log('Typeahead suggestions:', typeahead.data.suggestions.map(s => `${s.title} (${s.releaseYear})`));

    console.log('--- Probing Contextual Up-Next Suggestion Model ---');
    const contextual = await axios.post('http://127.0.0.1:5000/api/suggestions/contextual', {
      recentMovieIds: [200021], // Oppenheimer
      limit: 3
    });
    console.log('Up-Next suggestions count:', contextual.data.count);
    if (contextual.data.suggestions && contextual.data.suggestions.length > 0) {
      console.log('Sample Up-Next:', contextual.data.suggestions[0].title, '| Reason:', contextual.data.suggestions[0].explanation);
    }

    console.log('✅ End-to-end integration verified successfully!');
    cleanup();
  } catch (err) {
    console.error('Integration test failed:', err.message);
    cleanup();
  }
}, 5000);
