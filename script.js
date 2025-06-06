import { getProfile, updateProfile, getPosts, createPost, getUsers, getMessages, sendMessage } from './js/api.js';
import { formatRelativeTime, showToast } from './js/utils.js';
import { supabase } from './js/supabase.js';

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
      }, payload => {
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
    
    // Update UI state
    updateUIState();
  } catch (error) {
    console.error('Error loading content:', error);
    showToast(error.message, 'error');
  }
}

// Profile page setup
async function setupProfilePage() {
  const form = document.getElementById('profileForm');
  if (!form) return;

  try {
    const user = await getProfile();
    
    // Set up form fields
    const nameInput = document.getElementById('profileName');
    const bioInput = document.getElementById('profileBio');
    const pictureInput = document.getElementById('profilePicture');
    const preview = document.getElementById('profilePreview');
    
    nameInput.value = user.name || '';
    bioInput.value = user.bio || '';
    preview.src = user.image_url || 'https://via.placeholder.com/150';

    // Handle image preview
    pictureInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => preview.src = e.target.result;
        reader.readAsDataURL(file);
      }
    });

    // Handle form submission
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

// Export necessary functions
export {
  loadContent,
  toggleDarkMode,
  changeColorScheme
};