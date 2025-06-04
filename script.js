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

        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.checked = document.body.classList.contains('dark-mode');
        }

        const colorSchemeSelect = document.getElementById('colorScheme');
        if (colorSchemeSelect) {
            colorSchemeSelect.value = localStorage.getItem('colorScheme') || 'default';
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
    document.body.className = document.body.className.replace(/(default|red|blue|green|purple)-scheme/g, '');
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

    const colorScheme = localStorage.getItem('colorScheme') || 'default';
    document.body.classList.add(`${colorScheme}-scheme`);

    if (page === 'index.html' || page === 'login.html' || page === 'register.html') {
        // Don't load home content on login or register pages
        return;
    }

    loadContent('home-content.html'); // Load the home content by default
});

// Handle registration
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoader();

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const response = await fetch('https://unicircle-backend.onrender.com/api/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();
        if (response.ok) {
            document.getElementById('registerMessage').textContent = 'Registration successful! Please log in.';
            window.location.href = 'login.html';
        } else {
            document.getElementById('registerMessage').textContent = `Error: ${data.msg}`;
        }
        hideLoader();
    });
}

// Handle login
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoader();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        const response = await fetch('https://unicircle-backend.onrender.com/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            window.location.href = 'home.html';
        } else {
            document.getElementById('loginMessage').textContent = `Error: ${data.msg}`;
        }
        hideLoader();
    });
}
