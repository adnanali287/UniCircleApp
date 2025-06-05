const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // In production, use environment variable

app.use(cors());
app.use(express.json());

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

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
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const users = readJSON(USERS_FILE);
  if (users.some(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = { name, email, passwordHash, bio: '', image: '' };
  users.push(user);
  writeJSON(USERS_FILE, users);

  res.json({ success: true });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const users = readJSON(USERS_FILE);
  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '24h' });
  res.json({
    success: true,
    token,
    user: {
      name: user.name,
      email: user.email,
      bio: user.bio,
      image: user.image
    }
  });
});

app.get('/api/profile', authenticateToken, (req, res) => {
  const users = readJSON(USERS_FILE);
  const user = users.find(u => u.email === req.user.email);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({
    name: user.name,
    email: user.email,
    bio: user.bio,
    image: user.image
  });
});

app.post('/api/profile', authenticateToken, (req, res) => {
  const { name, bio, image } = req.body;
  const users = readJSON(USERS_FILE);
  const idx = users.findIndex(u => u.email === req.user.email);
  if (idx === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  users[idx] = {
    ...users[idx],
    name: name || users[idx].name,
    bio: bio || users[idx].bio,
    image: image || users[idx].image
  };

  writeJSON(USERS_FILE, users);
  res.json({ success: true });
});

app.get('/api/posts', authenticateToken, (req, res) => {
  const posts = readJSON(POSTS_FILE);
  res.json(posts);
});

app.post('/api/posts', authenticateToken, (req, res) => {
  const { text, image } = req.body;
  const posts = readJSON(POSTS_FILE);
  const newPost = {
    id: Date.now().toString(),
    author: req.user.email,
    text,
    image,
    createdAt: new Date().toISOString()
  };
  posts.push(newPost);
  writeJSON(POSTS_FILE, posts);
  res.json(newPost);
});

app.get('/api/messages', authenticateToken, (req, res) => {
  const { userId } = req.query;
  const messages = readJSON(MESSAGES_FILE)
    .filter(m => 
      (m.from === req.user.email && m.to === userId) ||
      (m.from === userId && m.to === req.user.email)
    );
  res.json(messages);
});

app.post('/api/messages', authenticateToken, (req, res) => {
  const { userId, message } = req.body;
  const messages = readJSON(MESSAGES_FILE);
  const newMessage = {
    id: Date.now().toString(),
    from: req.user.email,
    to: userId,
    text: message,
    createdAt: new Date().toISOString()
  };
  messages.push(newMessage);
  writeJSON(MESSAGES_FILE, messages);
  res.json(newMessage);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});