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

// Helper functions for local authentication
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

function getUsers() {
    return JSON.parse(localStorage.getItem('users') || '[]');
}

function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function setCurrentUser(email) {
    localStorage.setItem('token', email);
}

function getCurrentUser() {
    const email = localStorage.getItem('token');
    if (!email) return null;
    const users = getUsers();
    return users.find(u => u.email === email);
}

function updateCurrentUser(updated) {
    const users = getUsers();
    const idx = users.findIndex(u => u.email === updated.email);
    if (idx !== -1) {
        users[idx] = updated;
        saveUsers(users);
    }
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

            const users = getUsers();
            if (users.some(u => u.email === email)) {
                document.getElementById('registerMessage').textContent = 'Email already registered.';
                return;
            }

            const passwordHash = await hashPassword(password);
            users.push({ name, email, passwordHash, bio: '', image: '' });
            saveUsers(users);
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

            const users = getUsers();
            const passwordHash = await hashPassword(password);
            const user = users.find(u => u.email === email && u.passwordHash === passwordHash);

            if (user) {
                setCurrentUser(email);
                window.location.href = 'home.html';
            } else {
                document.getElementById('loginMessage').textContent = 'Invalid credentials.';
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
function setupProfilePage() {
    const form = document.getElementById('profileForm');
    if (!form) return;
    const user = getCurrentUser();
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

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        showLoader();

        user.name = nameInput.value.trim();
        user.bio = bioInput.value.trim();

        const file = pictureInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = ev => {
                user.image = ev.target.result;
                updateCurrentUser(user);
                document.getElementById('profileMessage').textContent = 'Profile updated.';
                hideLoader();
            };
            reader.readAsDataURL(file);
        } else {
            updateCurrentUser(user);
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
    const users = getUsers();
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
}

function setupHomePage() {
    const form = document.getElementById('postForm');
    if (!form) return;
    form.addEventListener('submit', e => {
        e.preventDefault();
        showLoader();
        const user = getCurrentUser();
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
function getMessages() {
    return JSON.parse(localStorage.getItem('messages') || '[]');
}

function saveMessages(msgs) {
    localStorage.setItem('messages', JSON.stringify(msgs));
}

function renderMessages() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    container.innerHTML = '';
    const msgs = getMessages();
    const users = getUsers();
    msgs.forEach(m => {
        const user = users.find(u => u.email === m.email) || { name: m.email };
        const div = document.createElement('div');
        div.className = 'chat-item';
        const content = document.createElement('div');
        content.className = 'chat-content';
        const h3 = document.createElement('h3');
        h3.textContent = user.name;
        const p = document.createElement('p');
        p.textContent = m.text;
        content.appendChild(h3);
        content.appendChild(p);
        div.appendChild(content);
        container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
}

function setupMessagesPage() {
    const form = document.getElementById('chatForm');
    if (!form) return;
    form.addEventListener('submit', e => {
        e.preventDefault();
        const user = getCurrentUser();
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        if (!text) return;
        const msgs = getMessages();
        msgs.push({ email: user.email, text });
        saveMessages(msgs);
        input.value = '';
        renderMessages();
    });
    renderMessages();
}
