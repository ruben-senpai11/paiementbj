import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@brands': path.resolve(__dirname, '../../packages/ui/assets/brands'),
    },
  },
  server: {
    port: 3000,
  },
});
