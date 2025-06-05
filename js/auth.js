import * as api from './api.js';

export function isAuthenticated() {
  return !!localStorage.getItem('token');
}

export async function login(email, password) {
  try {
    const user = await api.login(email, password);
    return user;
  } catch (error) {
    throw new Error(error.message || 'Login failed');
  }
}

export async function register(name, email, password) {
  try {
    await api.register(name, email, password);
  } catch (error) {
    throw new Error(error.message || 'Registration failed');
  }
}

export function logout() {
  localStorage.removeItem('token');
  window.location.href = '/login.html';
}