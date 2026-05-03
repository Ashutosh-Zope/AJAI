const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { getDb } = require('../db');
const { sign } = require('../middleware/auth');

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = sign({ id: user.id, email: user.email, name: user.name });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

router.post('/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'All fields required' });

  const db = getDb();
  const { v4: uuidv4 } = require('uuid');
  const hash = bcrypt.hashSync(password, 10);

  try {
    const id = uuidv4();
    db.prepare('INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)')
      .run(id, email.toLowerCase(), name, hash);
    const token = sign({ id, email: email.toLowerCase(), name });
    res.status(201).json({ token, user: { id, email: email.toLowerCase(), name } });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already in use' });
    throw e;
  }
});

module.exports = router;
