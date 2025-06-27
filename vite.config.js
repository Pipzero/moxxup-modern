import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.hdr'],
  css: {
    devSourcemap: true
  },
  server: {
    port: 5173
  }
});
