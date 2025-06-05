import { getProfile, updateProfile, getPosts, createPost, getUsers, getMessages, sendMessage } from './js/api.js';

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
function initApp() {
    const darkModeEnabled = JSON.parse(localStorage.getItem('darkMode'));
    if (darkModeEnabled) {
        document.body.classList.add('dark-mode');
    }

    const colorScheme = localStorage.getItem('colorScheme') || 'modern';
    document.body.classList.add(`${colorScheme}-scheme`);

    loadContent('home-content.html');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Profile page setup
async function setupProfilePage() {
    const form = document.getElementById('profileForm');
    if (!form) return;

    try {
        const user = await getProfile();
        if (!user) return;

        const nameInput = document.getElementById('profileName');
        const bioInput = document.getElementById('profileBio');
        const pictureInput = document.getElementById('profilePicture');
        const preview = document.getElementById('profilePreview');
        const message = document.getElementById('profileMessage');

        nameInput.value = user.name || '';
        bioInput.value = user.bio || '';
        if (user.image_url) {
            preview.src = user.image_url;
        } else {
            preview.src = 'https://via.placeholder.com/150';
        }

        pictureInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const saveButton = form.querySelector('button[type="submit"]');
            const originalText = saveButton.innerHTML;
            
            try {
                saveButton.disabled = true;
                saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
                message.textContent = '';

                await updateProfile({
                    name: nameInput.value.trim(),
                    bio: bioInput.value.trim(),
                    image: pictureInput.files[0]
                });

                message.style.color = 'var(--secondary-color)';
                message.textContent = 'Profile updated successfully!';
            } catch (error) {
                message.style.color = '#dc2626';
                message.textContent = `Error: ${error.message}`;
            } finally {
                saveButton.disabled = false;
                saveButton.innerHTML = originalText;
            }
        });
    } catch (error) {
        console.error('Error setting up profile:', error);
    }
}

// Posts setup
async function setupHomePage() {
    const form = document.getElementById('postForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoader();
        
        try {
            const text = document.getElementById('postText').value.trim();
            const file = document.getElementById('postImage').files[0];
            
            await createPost({ text, image: file });
            form.reset();
            await renderPosts();
        } catch (error) {
            console.error('Error creating post:', error);
        } finally {
            hideLoader();
        }
    });

    await renderPosts();
}

async function renderPosts() {
    const container = document.getElementById('postsContainer');
    if (!container) return;
    
    try {
        container.innerHTML = '';
        const posts = await getPosts();
        
        posts.forEach(post => {
            const div = document.createElement('div');
            div.className = 'feed-item';
            
            const img = document.createElement('img');
            img.className = 'profile-pic';
            img.src = post.author?.image_url || 'https://via.placeholder.com/50';
            
            const content = document.createElement('div');
            content.className = 'post-content';
            
            const h3 = document.createElement('h3');
            h3.textContent = post.author?.name || 'Anonymous';
            
            const pText = document.createElement('p');
            pText.textContent = post.text;
            
            content.appendChild(h3);
            content.appendChild(pText);
            
            if (post.image_url) {
                const pImg = document.createElement('img');
                pImg.src = post.image_url;
                pImg.className = 'post-image';
                content.appendChild(pImg);
            }
            
            div.appendChild(img);
            div.appendChild(content);
            container.appendChild(div);
        });
    } catch (error) {
        console.error('Error rendering posts:', error);
        container.innerHTML = '<p class="error">Failed to load posts.</p>';
    }
}

// Messages setup
async function setupMessagesPage() {
    const form = document.getElementById('chatForm');
    const select = document.getElementById('chatUserSelect');
    if (!form || !select) return;

    try {
        const users = await getUsers();
        const currentUser = await getProfile();
        
        select.innerHTML = users
            .filter(u => u.id !== currentUser.id)
            .map(u => `<option value="${u.id}">${u.name}</option>`)
            .join('');
            
        let activeUser = select.value;
        
        select.addEventListener('change', () => {
            activeUser = select.value;
            renderMessages(activeUser);
        });
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById('chatInput');
            const text = input.value.trim();
            if (!text) return;
            
            try {
                await sendMessage(activeUser, text);
                input.value = '';
                await renderMessages(activeUser);
            } catch (error) {
                console.error('Error sending message:', error);
            }
        });
        
        await renderMessages(activeUser);
    } catch (error) {
        console.error('Error setting up messages:', error);
    }
}

async function renderMessages(withUser) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    try {
        container.innerHTML = '';
        const messages = await getMessages(withUser);
        const currentUser = await getProfile();
        
        messages.forEach(msg => {
            const div = document.createElement('div');
            div.className = 'chat-item';
            
            const content = document.createElement('div');
            content.className = 'chat-content';
            
            const h3 = document.createElement('h3');
            h3.textContent = msg.from_id === currentUser.id ? 'You' : withUser;
            
            const p = document.createElement('p');
            p.textContent = msg.text;
            
            content.appendChild(h3);
            content.appendChild(p);
            div.appendChild(content);
            container.appendChild(div);
        });
        
        container.scrollTop = container.scrollHeight;
    } catch (error) {
        console.error('Error rendering messages:', error);
        container.innerHTML = '<p class="error">Failed to load messages.</p>';
    }
}

export {
    loadContent,
    toggleDarkMode,
    changeColorScheme,
    initApp
};