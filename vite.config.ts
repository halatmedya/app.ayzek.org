import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Use absolute path for main domain hosting
  base: '/app/',
  plugins: [react()],
  // Copy .htaccess to dist folder for SPA routing
  publicDir: 'public',
});
