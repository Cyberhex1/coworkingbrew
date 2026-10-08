import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          // keep the big, rarely-changing libraries in their own cacheable chunks
          manualChunks: { three: ['three'], react: ['react', 'react-dom', 'zustand'] },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Dev stand-in for the Cloudflare Pages Function at functions/api/book/[id].ts
      proxy: {
        '/api/book': {
          target: 'https://www.gutenberg.org',
          changeOrigin: true,
          rewrite: (p: string) => p.replace(/^\/api\/book\/(\d+).*$/, '/cache/epub/$1/pg$1.txt'),
        },
      },
    },
  };
});
