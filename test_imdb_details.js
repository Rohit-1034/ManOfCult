const http = require('http');

const BASE_URL = 'http://127.0.0.1:5000';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    const req = http.request(url, { method, headers: reqHeaders }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== CineMatch AI: IMDb Details & Features Test Suite ===\n');

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name} ->`, err.message);
    }
  }

  // 1. Health check
  await test('Backend Health', async () => {
    const res = await request('GET', '/health');
    if (res.status !== 200 || res.data.status !== 'healthy') {
      throw new Error(`Health status ${res.status}`);
    }
  });

  // 2. Auth for testing protected routes
  let token = null;
  await test('User Auth Login', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'admin@cinematch.ai',
      password: 'Admin@1234'
    });
    if (res.status !== 200 || !res.data.token) {
      throw new Error(`Login failed with status ${res.status}`);
    }
    token = res.data.token;
  });

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 3. Test comprehensive movie details for Toy Story (movieId: 1)
  await test('GET /api/movies/1 (Enriched Details)', async () => {
    const res = await request('GET', '/api/movies/1', null, authHeaders);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const m = res.data.movie;
    if (!m || m.title !== 'Toy Story') throw new Error(`Incorrect movie title: ${m?.title}`);
    if (!m.trailer?.embedUrl) throw new Error('Missing trailer embed URL');
    if (!m.cast || m.cast.length === 0) throw new Error('Missing cast');
    if (!m.details?.techSpecs) throw new Error('Missing tech specs');
    if (!m.parentsGuide) throw new Error('Missing parents guide');
    if (!m.didYouKnow?.trivia) throw new Error('Missing trivia');
    console.log(`   Director: ${m.crew?.director} | Stars: ${m.cast.map(c => c.name).slice(0, 2).join(', ')}`);
  });

  // 4. Test credits endpoint
  await test('GET /api/movies/1/credits', async () => {
    const res = await request('GET', '/api/movies/1/credits');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.data.cast || res.data.cast.length === 0) throw new Error('No cast returned');
  });

  // 5. Test videos endpoint
  await test('GET /api/movies/1/videos', async () => {
    const res = await request('GET', '/api/movies/1/videos');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.data.trailer?.embedUrl) throw new Error('No trailer returned');
  });

  // 6. Test images endpoint
  await test('GET /api/movies/1/images', async () => {
    const res = await request('GET', '/api/movies/1/images');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.data.photos || res.data.photos.length === 0) throw new Error('No photos returned');
  });

  // 7. Test movie recommendations with explainability
  await test('GET /api/movies/1/recommendations', async () => {
    const res = await request('GET', '/api/movies/1/recommendations?topK=4');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.data.recommendations || res.data.recommendations.length === 0) {
      throw new Error('No recommendations returned');
    }
    console.log(`   Top rec: ${res.data.recommendations[0].title}`);
  });

  // 8. Test reviews submission and retrieval
  let reviewId = null;
  await test('POST & GET /api/movies/1/reviews', async () => {
    const submitRes = await request('POST', '/api/movies/1/reviews', {
      rating: 5,
      headline: 'A Timeless Animated Masterpiece',
      review: 'Brilliant characters, groundbreaking animation, and endless heart.',
      containsSpoilers: false
    }, authHeaders);

    if (submitRes.status !== 201) throw new Error(`Submit status ${submitRes.status}`);
    reviewId = submitRes.data.review.id;

    const listRes = await request('GET', '/api/movies/1/reviews');
    if (listRes.status !== 200) throw new Error(`List status ${listRes.status}`);
    if (listRes.data.total === 0) throw new Error('Reviews total is 0');
  });

  // 9. Test review helpful vote
  await test('POST /api/movies/1/reviews/:reviewId/helpful', async () => {
    if (!reviewId) throw new Error('No reviewId to vote');
    let res = await request('POST', `/api/movies/1/reviews/${reviewId}/helpful`, null, authHeaders);
    if (res.status !== 200) throw new Error(`Vote status ${res.status}`);
    if (res.data.review.helpfulCount === 0) {
      // Was previously toggled on, toggle on again
      res = await request('POST', `/api/movies/1/reviews/${reviewId}/helpful`, null, authHeaders);
    }
    if (res.data.review.helpfulCount < 1) throw new Error('Helpful count did not increment');
  });

  // 10. Test Watchlist dual status (Watchlist & Watched)
  await test('POST & PATCH /api/watchlist/:movieId', async () => {
    // Add to watchlist
    const addRes = await request('POST', '/api/watchlist/1', { status: 'watchlist' }, authHeaders);
    if (addRes.status !== 201) throw new Error(`Add watchlist status ${addRes.status}`);

    // Mark as watched
    const patchRes = await request('PATCH', '/api/watchlist/1', { status: 'watched' }, authHeaders);
    if (patchRes.status !== 200) throw new Error(`Patch status ${patchRes.status}`);
    if (!patchRes.data.state.isWatched) throw new Error('Expected isWatched to be true');

    // Remove
    const delRes = await request('DELETE', '/api/watchlist/1', null, authHeaders);
    if (delRes.status !== 200) throw new Error(`Delete status ${delRes.status}`);
  });

  console.log(`\n=========================================`);
  console.log(`Results: ${passed}/${total} Tests Passed!`);
  console.log(`=========================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
