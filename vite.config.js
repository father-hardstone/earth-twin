import { defineConfig } from 'vite';

export default defineConfig({
  assetsInclude: ['**/*.webp', '**/*.png'],
  build: {
    chunkSizeWarningLimit: 1300,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('maplibre-gl')) {
            return 'maplibre-gl';
          }
        }
      }
    }
  }
});
