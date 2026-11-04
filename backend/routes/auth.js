const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

// Seed default admin account if not present
(async () => {
  const adminEmail = 'admin@cinematch.ai';
  if (!db.findUserByEmail(adminEmail)) {
    const hash = await bcrypt.hash('Admin@1234', 10);
    db.createUser({
      username: 'CineMatchAdmin',
      email: adminEmail,
      passwordHash: hash,
      favoriteGenres: ['Sci-Fi', 'Action', 'Drama'],
      favoriteMovies: [1, 260, 2571],
      role: 'admin'
    });
    console.log('Seeded default administrator: admin@cinematch.ai / Admin@1234');
  }
})();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, favoriteGenres, favoriteMovies } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = db.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = db.createUser({
      username,
      email,
      passwordHash,
      favoriteGenres: favoriteGenres || [],
      favoriteMovies: favoriteMovies || [],
      role: 'user'
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...userSafe } = user;
    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userSafe
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...userSafe } = user;
    return res.json({
      message: 'Login successful',
      token,
      user: userSafe
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;
