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

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const darkModeEnabled = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', darkModeEnabled);
}

function changeColorScheme() {
    const colorScheme = document.getElementById('colorScheme').value;
    document.body.className = document.body.className.replace(/(default|red|blue|green|purple)-scheme/g, '');
    document.body.classList.add(`${colorScheme}-scheme`);
    localStorage.setItem('colorScheme', colorScheme);
}

// Load preferences
document.addEventListener('DOMContentLoaded', () => {
    const darkModeEnabled = JSON.parse(localStorage.getItem('darkMode'));
    if (darkModeEnabled) {
        document.body.classList.add('dark-mode');
    }
    
    const colorScheme = localStorage.getItem('colorScheme') || 'default';
    document.body.classList.add(`${colorScheme}-scheme`);

    loadContent('home.html'); // Load the home content by default
});