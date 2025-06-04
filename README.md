# UniCircle App

This project requires running a small Node.js backend to handle authentication and messages. If you get "registration failed" or "login failed" errors, it usually means the server is not running or dependencies are missing.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the backend server:
   ```bash
   npm run server
   ```
   The server listens on `http://localhost:3000`.

3. Open `index.html` (or `npm run dev` to start a simple static file server) and register or log in.

Make sure the browser can reach `http://localhost:3000`. The site uses this URL for API requests.
