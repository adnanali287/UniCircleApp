const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

app.use(cors());
app.use(express.json());

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    return [];
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  const users = readJSON(USERS_FILE);
  if (users.some(u => u.email === email)) return res.status(400).json({ error: 'Email already registered' });
  const passwordHash = await bcrypt.hash(password, 10);
  users.push({ name, email, passwordHash, bio: '', image: '' });
  writeJSON(USERS_FILE, users);
  res.json({ success: true });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const users = readJSON(USERS_FILE);
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ success: true, user: { name: user.name, email: user.email, bio: user.bio, image: user.image } });
});

app.get('/api/users', (req, res) => {
  const users = readJSON(USERS_FILE).map(u => ({ name: u.name, email: u.email, image: u.image }));
  res.json(users);
});

app.post('/api/profile', (req, res) => {
  const { email, name, bio, image } = req.body;
  const users = readJSON(USERS_FILE);
  const idx = users.findIndex(u => u.email === email);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  users[idx] = { ...users[idx], name, bio, image };
  writeJSON(USERS_FILE, users);
  res.json({ success: true });
});

app.get('/api/messages', (req, res) => {
  const { user1, user2 } = req.query;
  if (!user1 || !user2) return res.json([]);
  const msgs = readJSON(MESSAGES_FILE).filter(m => (m.from === user1 && m.to === user2) || (m.from === user2 && m.to === user1));
  res.json(msgs);
});

app.post('/api/messages', (req, res) => {
  const { from, to, text } = req.body;
  if (!from || !to || !text) return res.status(400).json({ error: 'Missing fields' });
  const msgs = readJSON(MESSAGES_FILE);
  msgs.push({ from, to, text, ts: Date.now() });
  writeJSON(MESSAGES_FILE, msgs);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
