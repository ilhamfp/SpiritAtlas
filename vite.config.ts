import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: { host: '127.0.0.1' },
  build: {
    chunkSizeWarningLimit: 1100,
    rollupOptions: { output: { manualChunks: (id: string) => id.includes('maplibre-gl') ? 'map' : /node_modules\/(three|@react-three|three-stdlib)/.test(id) ? 'three' : undefined } },
  },
});
