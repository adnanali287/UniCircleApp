import { getProfile, updateProfile, getPosts, createPost, getMessages, sendMessage } from './js/api.js';
import { formatRelativeTime, showToast } from './js/utils.js';
import { supabase } from './js/supabase.js';
import { logout } from './js/auth.js';

// Initialize real-time subscriptions
function initializeRealtime() {
  // Subscribe to new posts
  const postsSubscription = supabase
    .channel('public:posts')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'posts'
    }, payload => {
      renderNewPost(payload.new);
    })
    .subscribe();

  // Subscribe to new messages when in chat
  if (window.location.pathname.includes('messages.html')) {
    const messagesSubscription = supabase
      .channel('public:messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, async payload => {
        const currentUser = await getProfile();
        if (payload.new.from_id === currentUser.id || payload.new.to_id === currentUser.id) {
          renderNewMessage(payload.new);
        }
      })
      .subscribe();
  }
}

// Load content dynamically
async function loadContent(page) {
  try {
    const response = await fetch(page);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const html = await response.text();
    document.getElementById('app-content').innerHTML = html;
    
    // Setup page-specific handlers
    if (page === 'profile.html') await setupProfilePage();
    if (page.includes('home')) await setupHomePage();
    if (page.includes('messages')) await setupMessagesPage();
    
    // Update active state in bottom navigation
    updateActiveNav(page);
  } catch (error) {
    console.error('Error loading content:', error);
    showToast(error.message, 'error');
  }
}

function updateActiveNav(page) {
  const buttons = document.querySelectorAll('.bottom-nav button');
  buttons.forEach(button => {
    button.classList.remove('active');
    if (button.onclick && button.onclick.toString().includes(page)) {
      button.classList.add('active');
    }
  });
}

// Profile page setup
async function setupProfilePage() {
  const form = document.getElementById('profileForm');
  if (!form) return;

  try {
    const user = await getProfile();
    
    const nameInput = document.getElementById('profileName');
    const bioInput = document.getElementById('profileBio');
    const pictureInput = document.getElementById('profilePicture');
    const preview = document.getElementById('profilePreview');
    
    nameInput.value = user.name || '';
    bioInput.value = user.bio || '';
    preview.src = user.image_url || 'https://via.placeholder.com/150';

    pictureInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => preview.src = e.target.result;
        reader.readAsDataURL(file);
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveButton = form.querySelector('button[type="submit"]');
      
      try {
        saveButton.disabled = true;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        await updateProfile({
          name: nameInput.value.trim(),
          bio: bioInput.value.trim(),
          image: pictureInput.files[0]
        });

        showToast('Profile updated successfully');
      } catch (error) {
        showToast(error.message, 'error');
      } finally {
        saveButton.disabled = false;
        saveButton.innerHTML = '<i class="fas fa-check"></i> Save Changes';
      }
    });
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Home page setup
async function setupHomePage() {
  const form = document.getElementById('postForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    const text = document.getElementById('postText').value.trim();
    const imageFile = document.getElementById('postImage').files[0];

    if (!text) return;

    try {
      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';

      await createPost({
        text,
        image: imageFile
      });

      form.reset();
      showToast('Post created successfully');
      await renderPosts();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = 'Post';
    }
  });

  await renderPosts();
}

async function renderPosts() {
  const container = document.getElementById('postsContainer');
  if (!container) return;

  try {
    const posts = await getPosts();
    container.innerHTML = '';

    posts.forEach(post => {
      const div = document.createElement('div');
      div.className = 'feed-item';
      
      div.innerHTML = `
        <img class="profile-pic" src="${post.author.image_url || 'https://via.placeholder.com/50'}" alt="${post.author.name}">
        <div class="post-content">
          <h3>${post.author.name}</h3>
          <p>${post.text}</p>
          ${post.image_url ? `<img src="${post.image_url}" class="post-image" alt="Post image">` : ''}
          <small>${formatRelativeTime(post.created_at)}</small>
        </div>
      `;
      
      container.appendChild(div);
    });
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Initialize the app
async function initApp() {
  try {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = '/login.html';
      return;
    }

    // Initialize real-time features
    initializeRealtime();
    
    // Load initial content
    await loadContent('home-content.html');
    
    // Set up theme
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) document.body.classList.add('dark-mode');
    
    const colorScheme = localStorage.getItem('colorScheme') || 'modern';
    document.body.classList.add(`${colorScheme}-scheme`);
  } catch (error) {
    console.error('Error initializing app:', error);
    showToast(error.message, 'error');
  }
}

// Start the app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Theme functions
function toggleDarkMode() {
  const darkMode = document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', darkMode);
}

function changeColorScheme() {
  const select = document.getElementById('colorScheme');
  const scheme = select.value;
  
  document.body.classList.remove(
    'default-scheme',
    'red-scheme',
    'blue-scheme',
    'green-scheme',
    'purple-scheme',
    'modern-scheme'
  );
  
  document.body.classList.add(`${scheme}-scheme`);
  localStorage.setItem('colorScheme', scheme);
}

// Export necessary functions for module imports
export {
  loadContent,
  toggleDarkMode,
  changeColorScheme,
  logout,
  initApp // Added initApp to exports
};