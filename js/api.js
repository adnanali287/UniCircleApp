const API_BASE = 'http://localhost:3000/api';

// Authentication API calls
export async function login(email, password) {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }
  
  const data = await response.json();
  localStorage.setItem('token', data.token);
  return data.user;
}

export async function register(name, email, password) {
  const response = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }
  
  return response.json();
}

export async function getProfile() {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');
  
  const response = await fetch(`${API_BASE}/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) throw new Error('Failed to fetch profile');
  return response.json();
}

export async function updateProfile(profileData) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');
  
  const response = await fetch(`${API_BASE}/profile`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profileData)
  });
  
  if (!response.ok) throw new Error('Failed to update profile');
  return response.json();
}

// Posts API calls
export async function getPosts() {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');
  
  const response = await fetch(`${API_BASE}/posts`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) throw new Error('Failed to fetch posts');
  return response.json();
}

export async function createPost(postData) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');
  
  const response = await fetch(`${API_BASE}/posts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(postData)
  });
  
  if (!response.ok) throw new Error('Failed to create post');
  return response.json();
}

// Messages API calls
export async function getMessages(userId) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');
  
  const response = await fetch(`${API_BASE}/messages?userId=${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) throw new Error('Failed to fetch messages');
  return response.json();
}

export async function sendMessage(userId, message) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');
  
  const response = await fetch(`${API_BASE}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId, message })
  });
  
  if (!response.ok) throw new Error('Failed to send message');
  return response.json();
}