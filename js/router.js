// Simple client-side router
export class Router {
  constructor(routes) {
    this.routes = routes;
    this.currentPath = '';
    
    window.addEventListener('popstate', () => this.handleRoute());
    
    // Handle initial route
    this.handleRoute();
  }

  navigate(path) {
    window.history.pushState(null, '', path);
    this.handleRoute();
  }

  async handleRoute() {
    const path = window.location.pathname;
    if (path === this.currentPath) return;
    
    this.currentPath = path;
    const route = this.routes[path] || this.routes['/404'];
    
    try {
      const content = await route();
      document.getElementById('app-content').innerHTML = content;
      this.setupPageHandlers();
    } catch (error) {
      console.error('Route handling error:', error);
    }
  }

  setupPageHandlers() {
    // Setup page-specific handlers based on current content
    if (document.getElementById('postForm')) {
      setupHomePage();
    }
    if (document.getElementById('profileForm')) {
      setupProfilePage();
    }
    if (document.getElementById('chatForm')) {
      setupMessagesPage();
    }
  }
}