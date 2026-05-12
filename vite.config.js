import { defineConfig } from 'vite';
import vitePluginCesium from 'vite-plugin-cesium';

export default defineConfig({
  assetsInclude: ['**/*.webp', '**/*.png'],
  plugins: [vitePluginCesium()],
  build: {
    chunkSizeWarningLimit: 1300,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('maplibre-gl')) {
            return 'maplibre-gl';
          }
          if (id.includes('cesium')) {
            return 'cesium';
          }
        }
      }
    }
  }
});
