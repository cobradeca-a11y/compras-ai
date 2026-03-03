import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Build do frontend vai direto para /public (que é servido pelo Express)
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'public',
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    port: 5173,
  },
});
