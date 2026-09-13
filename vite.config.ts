import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import typegpu from 'unplugin-typegpu/vite';
export default defineConfig({
  plugins: [typegpu(), react()],
  server: { host: '127.0.0.1' },
  build: {
    chunkSizeWarningLimit: 1100,
    rollupOptions: { output: { manualChunks: (id: string) => /three\/(src\/(nodes|materials\/nodes|renderers\/(webgpu|common|webgl-fallback))|build\/three\.(webgpu|tsl))/.test(id) ? 'studio-gpu' : /node_modules\/(react|react-dom|scheduler)\//.test(id) ? 'react' : id.includes('maplibre-gl') ? 'map' : /node_modules\/(three|@react-three|three-stdlib)/.test(id) ? 'three' : undefined } },
  },
});
