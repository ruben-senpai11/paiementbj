import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@paiementbj/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
      '@paiementbj/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
      '@paiementbj/schemas': path.resolve(__dirname, '../../packages/schemas/src/index.ts'),
      '@paiementbj/api-client': path.resolve(__dirname, '../../packages/api-client/src/index.ts'),
    },
  },
  server: {
    port: Number(process.env.PORT) || 3001,
    proxy: {
      '/v1': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
