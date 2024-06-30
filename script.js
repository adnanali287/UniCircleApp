// Load content dynamically
function loadContent(page) {
    fetch(page)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            document.getElementById('app-content').innerHTML = html;
            // Handle dark mode toggle
            const darkModeToggle = document.getElementById('darkModeToggle');
            if (darkModeToggle) {
                darkModeToggle.checked = document.body.classList.contains('dark-mode');
            }

            // Handle color scheme selection
            const colorSchemeSelect = document.getElementById('colorScheme');
            if (colorSchemeSelect) {
                colorSchemeSelect.value = localStorage.getItem('colorScheme') || 'default';
            }
        })
        .catch(error => {
            console.warn('Error loading content:', error);
        });
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
    if (!token && window.location.pathname !== '/index.html' && window.location.pathname !== '/register.html') {
        window.location.href = 'index.html';
    }

    const darkModeEnabled = JSON.parse(localStorage.getItem('darkMode'));
    if (darkModeEnabled) {
        document.body.classList.add('dark-mode');
    }

    const colorScheme = localStorage.getItem('colorScheme') || 'default';
    document.body.classList.add(`${colorScheme}-scheme`);

    if (window.location.pathname === '/index.html' || window.location.pathname === '/register.html') {
        // Don't load home content on login or register pages
        return;
    }

    loadContent('home.html'); // Load the home content by default
});

// Handle registration
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();

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
            window.location.href = 'index.html'; // Redirect to login page
        } else {
            document.getElementById('registerMessage').textContent = `Error: ${data.msg}`;
        }
    });
}

// Handle login
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();

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
            localStorage.setItem('token', data.token); // Store the token in localStorage
            window.location.href = 'home.html'; // Redirect to the main page
        } else {
            document.getElementById('loginMessage').textContent = `Error: ${data.msg}`;
        }
    });
}
