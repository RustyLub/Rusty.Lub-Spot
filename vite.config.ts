import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    // GitHub Pages hosts this repository under /Rusty.Lub-Spot/.
    // Local development and the Node.js deployment continue using /.
    base: process.env.GITHUB_ACTIONS ? '/Rusty.Lub-Spot/' : '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || __dirname, '.'),
      },
    },
    server: {
      hmr: process.env.NODE_ENV !== 'production' && process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
