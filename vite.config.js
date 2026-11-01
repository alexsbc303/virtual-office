import { defineConfig } from 'vite';

// Replace REPO_NAME with the GitHub repository name when deploying to GitHub Pages.
export default defineConfig({
  base: '/virtual-office/',
  server: {
    host: true,
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
