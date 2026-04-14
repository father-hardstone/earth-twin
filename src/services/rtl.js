const RTL_PLUGIN_URL =
  'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.3.0/dist/mapbox-gl-rtl-text.js';

export function enableRtlText(maplibregl) {
  if (!maplibregl || typeof maplibregl.setRTLTextPlugin !== 'function') {
    return;
  }

  try {
    maplibregl.setRTLTextPlugin(RTL_PLUGIN_URL, () => {}, true);
  } catch (error) {
    console.warn('RTL text plugin failed to load:', error);
  }
}
