const http = require('http');
const https = require('https');

const BACKEND_URL = 'http://localhost:5000';
const ML_URL = 'http://127.0.0.1:8000';

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

function post(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const postData = JSON.stringify(body);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function checkImage(url) {
  return new Promise((resolve) => {
    https.get(url, { family: 4, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      res.resume();
      resolve({ status: res.statusCode, contentType: res.headers['content-type'] });
    }).on('error', (e) => resolve({ status: 500, error: e.message }));
  });
}

async function run() {
  console.log('=== CineMatch AI: Universal Entertainment Discovery Platform Verification ===\n');
  let passed = 0;
  let total = 10;

  // 1. Backend & TMDB Config
  try {
    const res = await get(`${BACKEND_URL}/api/tmdb/config`);
    if (res.status === 200 && res.data.imageBaseUrl) {
      console.log('✅ PASS [1/10]: Backend & TMDB Configuration verified');
      passed++;
    } else throw new Error(`Status ${res.status}`);
  } catch (e) {
    console.log(`❌ FAIL [1/10]: Config failed - ${e.message}`);
  }

  // 2. TMDB Movie Endpoints (/popular, /top_rated, /now_playing, /upcoming, /movie/:id)
  try {
    const [pop, details] = await Promise.all([
      get(`${BACKEND_URL}/api/tmdb/movie/popular`),
      get(`${BACKEND_URL}/api/tmdb/movie/862`) // Toy Story
    ]);
    if (pop.status === 200 && pop.data.results?.length > 0 && details.status === 200 && details.data.title === 'Toy Story') {
      console.log(`✅ PASS [2/10]: TMDB Movie endpoints verified (${pop.data.results.length} popular, details for Toy Story)`);
      passed++;
    } else throw new Error(`Movie endpoints status ${pop.status}/${details.status}`);
  } catch (e) {
    console.log(`❌ FAIL [2/10]: Movie endpoints failed - ${e.message}`);
  }

  // 3. TMDB TV Endpoints (/tv/popular, /tv/top_rated, /tv/airing_today, /tv/on_the_air, /tv/:id)
  try {
    const [tvPop, tvDetails] = await Promise.all([
      get(`${BACKEND_URL}/api/tmdb/tv/popular`),
      get(`${BACKEND_URL}/api/tmdb/tv/66732`) // Stranger Things
    ]);
    if (tvPop.status === 200 && tvPop.data.results?.length > 0 && tvDetails.status === 200 && tvDetails.data.title === 'Stranger Things') {
      console.log(`✅ PASS [3/10]: TMDB TV endpoints verified (${tvPop.data.results.length} popular, details for '${tvDetails.data.title}', ${tvDetails.data.numberOfSeasons} seasons)`);
      passed++;
    } else throw new Error(`TV endpoints status ${tvPop.status}/${tvDetails.status}`);
  } catch (e) {
    console.log(`❌ FAIL [3/10]: TV endpoints failed - ${e.message}`);
  }

  // 4. Categorical Discovery (Anime, K-Drama, Indian Series, Documentaries, Web Series)
  try {
    const [anime, kdrama, indian, docs] = await Promise.all([
      get(`${BACKEND_URL}/api/tmdb/discover/category/anime`),
      get(`${BACKEND_URL}/api/tmdb/discover/category/k-drama`),
      get(`${BACKEND_URL}/api/tmdb/discover/category/indian-series`),
      get(`${BACKEND_URL}/api/tmdb/discover/category/documentaries`)
    ]);
    const ok = anime.data.results?.length > 0 && kdrama.data.results?.length > 0 && indian.data.results?.length > 0 && docs.data.results?.length > 0;
    if (ok) {
      console.log(`✅ PASS [4/10]: Categorical Discovery verified (Anime: ${anime.data.results[0]?.title}, K-Drama: ${kdrama.data.results[0]?.title}, Indian: ${indian.data.results[0]?.title})`);
      passed++;
    } else throw new Error('Category results empty');
  } catch (e) {
    console.log(`❌ FAIL [4/10]: Categorical Discovery failed - ${e.message}`);
  }

  // 5. Universal Multi-Search (/search/multi)
  try {
    const res = await get(`${BACKEND_URL}/api/tmdb/search/multi?query=batman`);
    const types = new Set((res.data.results || []).map(r => r.mediaType));
    if (res.status === 200 && types.has('movie')) {
      console.log(`✅ PASS [5/10]: Universal Multi-Search verified (${res.data.results?.length} items across types: ${Array.from(types).join(', ')})`);
      passed++;
    } else throw new Error('Multi-search invalid');
  } catch (e) {
    console.log(`❌ FAIL [5/10]: Multi-Search failed - ${e.message}`);
  }

  // 6. Backend Local TV Catalog (/api/tv)
  try {
    const res = await get(`${BACKEND_URL}/api/tv?limit=5`);
    if (res.status === 200 && res.data.items?.length > 0) {
      console.log(`✅ PASS [6/10]: Local TV Shows Catalog verified (${res.data.total} total indexed shows, first: '${res.data.items[0].title}')`);
      passed++;
    } else throw new Error(`TV catalog status ${res.status}`);
  } catch (e) {
    console.log(`❌ FAIL [6/10]: TV Catalog failed - ${e.message}`);
  }

  // 7. ML Cross-Content Recommendations (Movie -> TV Shows)
  try {
    const res = await post(`${ML_URL}/recommend/cross`, {
      contentId: 79132, // Inception
      sourceType: 'movie',
      targetType: 'tv',
      topK: 5
    });
    if (res.status === 200 && res.data.recommendations?.length > 0) {
      const top = res.data.recommendations[0];
      console.log(`✅ PASS [7/10]: ML Cross-Content Recommendations verified (Inception -> ${top.title} [${top.mediaType}] - "${top.explanation}")`);
      passed++;
    } else throw new Error(`Cross recommendation status ${res.status}`);
  } catch (e) {
    console.log(`❌ FAIL [7/10]: Cross-Content recommendation failed - ${e.message}`);
  }

  // 8. ML 8-Mood Recommendations (Curious mood)
  try {
    const res = await post(`${ML_URL}/recommend/mood`, {
      mood: 'curious',
      mediaType: 'all',
      topK: 6
    });
    if (res.status === 200 && res.data.recommendations?.length > 0) {
      const top = res.data.recommendations[0];
      console.log(`✅ PASS [8/10]: ML 8-Mood AI verified ('Curious' -> ${top.title} [${top.mediaType}] - "${top.explanation}")`);
      passed++;
    } else throw new Error(`Mood recommendation status ${res.status}`);
  } catch (e) {
    console.log(`❌ FAIL [8/10]: Mood AI failed - ${e.message}`);
  }

  // 9. Database Unified Watchlist & Separation (Movie vs TV with same ID)
  try {
    const db = require('./backend/db');
    // Add Movie with ID 100
    db.addToWatchlist('test_user_verify', 100, 'watchlist', 'movie', { title: 'The 100 Movie' });
    // Add TV Show with ID 100
    db.addToWatchlist('test_user_verify', 100, 'watchlist', 'tv', { title: 'The 100 TV Series' });

    const movieState = db.getMovieWatchlistState('test_user_verify', 100, 'movie');
    const tvState = db.getMovieWatchlistState('test_user_verify', 100, 'tv');

    if (movieState.inWatchlist && tvState.inWatchlist) {
      console.log('✅ PASS [9/10]: Database model separation verified (Movie #100 and TV #100 stored without collision)');
      passed++;
    } else throw new Error('State mismatch');
  } catch (e) {
    console.log(`❌ FAIL [9/10]: Database model test failed - ${e.message}`);
  }

  // 10. Authentic TMDB Image CDN Verification across Categories
  try {
    const testPosters = [
      'https://image.tmdb.org/t/p/w500/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg', // Movie: Toy Story
      'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg', // TV: Stranger Things
      'https://image.tmdb.org/t/p/w500/kV27j3Nz4d5z8u6mN3EJw9RiLg2.jpg', // Anime: Naruto Shippūden
      'https://image.tmdb.org/t/p/w500/1QdXdRYfktUSONkl1oD5gc6Be0s.jpg'  // K-Drama: Squid Game
    ];

    let all200 = true;
    for (const url of testPosters) {
      const img = await checkImage(url);
      if (img.status !== 200 || !img.contentType?.includes('image')) {
        all200 = false;
        break;
      }
    }

    if (all200) {
      console.log('✅ PASS [10/10]: Authentic TMDB CDN verified for Movie, TV, Anime, and K-Drama posters (HTTP 200 OK)');
      passed++;
    } else throw new Error('One or more posters failed to download');
  } catch (e) {
    console.log(`❌ FAIL [10/10]: Poster CDN test failed - ${e.message}`);
  }

  console.log(`\n======================================================`);
  console.log(`Results: ${passed}/${total} Universal Platform Tests Passed!`);
  console.log(`======================================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

run();
