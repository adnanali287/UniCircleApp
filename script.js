// Load content dynamically
async function loadContent(page) {
    showLoader();
    try {
        const response = await fetch(page);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        document.getElementById('app-content').innerHTML = html;
        if (page === 'profile.html') {
            setupProfilePage();
        }
        if (document.getElementById('postForm')) {
            setupHomePage();
        }
        if (document.getElementById('chatForm')) {
            setupMessagesPage();
        }

        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.checked = document.body.classList.contains('dark-mode');
        }

        const colorSchemeSelect = document.getElementById('colorScheme');
        if (colorSchemeSelect) {
            colorSchemeSelect.value = localStorage.getItem('colorScheme') || 'modern';
        }
    } catch (error) {
        console.warn('Error loading content:', error);
        document.getElementById('app-content').innerHTML = '<p class="error">Failed to load content.</p>';
    } finally {
        hideLoader();
    }
}

function showLoader() {
    const loader = document.getElementById('loadingOverlay');
    if (loader) {
        loader.style.display = 'flex';
    }
}

function hideLoader() {
    const loader = document.getElementById('loadingOverlay');
    if (loader) {
        loader.style.display = 'none';
    }
}

// Toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const darkModeEnabled = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', darkModeEnabled);
}

// Change color scheme
function changeColorScheme() {
    const colorScheme = document.getElementById('colorScheme').value;
    document.body.className = document.body.className.replace(/(default|red|blue|green|purple|modern)-scheme/g, '');
    document.body.classList.add(`${colorScheme}-scheme`);
    localStorage.setItem('colorScheme', colorScheme);
}

// Load preferences and check authentication
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const page = window.location.pathname.split('/').pop();
    if (!token && page !== 'index.html' && page !== 'login.html' && page !== 'register.html') {
        window.location.href = 'index.html';
        return;
    }

    const darkModeEnabled = JSON.parse(localStorage.getItem('darkMode'));
    if (darkModeEnabled) {
        document.body.classList.add('dark-mode');
    }

    const colorScheme = localStorage.getItem('colorScheme') || 'modern';
    document.body.classList.add(`${colorScheme}-scheme`);

    if (page === 'index.html' || page === 'login.html' || page === 'register.html') {
        // Don't load home content on login or register pages
        return;
    }

    loadContent('home-content.html'); // Load the home content by default
});

const API_BASE = 'http://localhost:3000/api';

// Helper functions for local authentication with server fallback
async function hashPassword(password) {
    try {
        if (window.crypto && window.crypto.subtle) {
            const enc = new TextEncoder().encode(password);
            const buf = await crypto.subtle.digest('SHA-256', enc);
            return Array.from(new Uint8Array(buf))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        }
    } catch (err) {
        console.warn('crypto.subtle not available, using CryptoJS');
    }
    if (window.CryptoJS) {
        return CryptoJS.SHA256(password).toString();
    }
    return btoa(password);
}

async function apiGetUsers() {
    const res = await fetch(`${API_BASE}/users`);
    return await res.json();
}

function setCurrentUser(email) {
    localStorage.setItem('token', email);
}

async function apiGetCurrentUser() {
    const email = localStorage.getItem('token');
    if (!email) return null;
    const users = await apiGetUsers();
    return users.find(u => u.email === email);
}

async function apiUpdateCurrentUser(updated) {
    await fetch(`${API_BASE}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
    });
}

// Handle registration
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoader();
        try {
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            const res = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            if (!res.ok) {
                const data = await res.json();
                document.getElementById('registerMessage').textContent = data.error || 'Registration failed.';
                return;
            }
            document.getElementById('registerMessage').textContent = 'Registration successful! Please log in.';
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        } catch (err) {
            console.error(err);
            document.getElementById('registerMessage').textContent = 'Registration failed.';
        } finally {
            hideLoader();
        }
    });
}

// Handle login
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoader();
        try {
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;

            const res = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (res.ok) {
                setCurrentUser(email);
                window.location.href = 'home.html';
            } else {
                const data = await res.json();
                document.getElementById('loginMessage').textContent = data.error || 'Invalid credentials.';
            }
        } catch (err) {
            console.error(err);
            document.getElementById('loginMessage').textContent = 'Login failed.';
        } finally {
            hideLoader();
        }
    });
}

// Profile page setup
async function setupProfilePage() {
    const form = document.getElementById('profileForm');
    if (!form) return;
    const user = await apiGetCurrentUser();
    if (!user) return;

    const nameInput = document.getElementById('profileName');
    const bioInput = document.getElementById('profileBio');
    const pictureInput = document.getElementById('profilePicture');
    const preview = document.getElementById('profilePreview');

    nameInput.value = user.name || '';
    bioInput.value = user.bio || '';
    if (user.image) {
        preview.src = user.image;
    }

    pictureInput.addEventListener('change', () => {
        const file = pictureInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => {
                preview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoader();

        user.name = nameInput.value.trim();
        user.bio = bioInput.value.trim();

        const file = pictureInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async ev => {
                user.image = ev.target.result;
                await apiUpdateCurrentUser(user);
                document.getElementById('profileMessage').textContent = 'Profile updated.';
                hideLoader();
            };
            reader.readAsDataURL(file);
        } else {
            await apiUpdateCurrentUser(user);
            document.getElementById('profileMessage').textContent = 'Profile updated.';
            hideLoader();
        }
    });
}

// ----- Posts -----
function getPosts() {
    return JSON.parse(localStorage.getItem('posts') || '[]');
}

function savePosts(posts) {
    localStorage.setItem('posts', JSON.stringify(posts));
}

function renderPosts() {
    const container = document.getElementById('postsContainer');
    if (!container) return;
    container.innerHTML = '';
    const posts = getPosts();
    apiGetUsers().then(users => {
    posts.slice().reverse().forEach(p => {
        const user = users.find(u => u.email === p.email) || { name: p.email };
        const div = document.createElement('div');
        div.className = 'feed-item';
        const img = document.createElement('img');
        img.className = 'profile-pic';
        img.src = user.image || 'profile1.jpg';
        const content = document.createElement('div');
        content.className = 'post-content';
        const h3 = document.createElement('h3');
        h3.textContent = user.name;
        const pText = document.createElement('p');
        pText.textContent = p.text;
        content.appendChild(h3);
        content.appendChild(pText);
        if (p.image) {
            const pImg = document.createElement('img');
            pImg.src = p.image;
            pImg.className = 'post-image';
            content.appendChild(pImg);
        }
        div.appendChild(img);
        div.appendChild(content);
        container.appendChild(div);
    });
    });
}

async function setupHomePage() {
    const form = document.getElementById('postForm');
    if (!form) return;
    const user = await apiGetCurrentUser();
    form.addEventListener('submit', e => {
        e.preventDefault();
        showLoader();
        if (!user) return;
        const text = document.getElementById('postText').value.trim();
        const file = document.getElementById('postImage').files[0];
        const newPost = { email: user.email, text, image: '' };
        const saveAndRender = () => {
            const posts = getPosts();
            posts.push(newPost);
            savePosts(posts);
            form.reset();
            renderPosts();
            hideLoader();
        };
        if (file) {
            const reader = new FileReader();
            reader.onload = ev => {
                newPost.image = ev.target.result;
                saveAndRender();
            };
            reader.readAsDataURL(file);
        } else {
            saveAndRender();
        }
    });
    renderPosts();
}

// ----- Chat -----
async function apiGetMessages(user1, user2) {
    const res = await fetch(`${API_BASE}/messages?user1=${encodeURIComponent(user1)}&user2=${encodeURIComponent(user2)}`);
    return await res.json();
}

async function apiSendMessage(from, to, text) {
    await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, text })
    });
}

async function renderMessages(withUser) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    container.innerHTML = '';
    const current = localStorage.getItem('token');
    const msgs = await apiGetMessages(current, withUser);
    msgs.forEach(m => {
        const div = document.createElement('div');
        div.className = 'chat-item';
        const content = document.createElement('div');
        content.className = 'chat-content';
        const h3 = document.createElement('h3');
        h3.textContent = m.from === current ? 'You' : withUser;
        const p = document.createElement('p');
        p.textContent = m.text;
        content.appendChild(h3);
        content.appendChild(p);
        div.appendChild(content);
        container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
}

async function setupMessagesPage() {
    const form = document.getElementById('chatForm');
    const select = document.getElementById('chatUserSelect');
    if (!form || !select) return;
    const users = await apiGetUsers();
    const current = localStorage.getItem('token');
    select.innerHTML = users.filter(u => u.email !== current).map(u => `<option value="${u.email}">${u.name}</option>`).join('');
    let activeUser = select.value;
    select.addEventListener('change', () => {
        activeUser = select.value;
        renderMessages(activeUser);
    });
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        if (!text) return;
        await apiSendMessage(current, activeUser, text);
        input.value = '';
        renderMessages(activeUser);
    });
    renderMessages(activeUser);
}
