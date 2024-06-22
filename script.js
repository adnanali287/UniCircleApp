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
        })
        .catch(error => {
            console.warn('Error loading content:', error);
        });
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const darkModeEnabled = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', darkModeEnabled);
}

// Load dark mode preference
document.addEventListener('DOMContentLoaded', () => {
    const darkModeEnabled = JSON.parse(localStorage.getItem('darkMode'));
    if (darkModeEnabled) {
        document.body.classList.add('dark-mode');
    }
    loadContent('home.html'); // Load the home content by default
})