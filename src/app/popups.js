export function buildFeatureMeta(feature) {
  if (feature.properties?.class) {
    return `${feature.layer.type} layer - ${String(feature.properties.class).replaceAll('_', ' ')}`;
  }

  return feature.layer?.id?.replaceAll('-', ' ') ?? 'feature';
}

export function removePopup(ctx) {
  const { state } = ctx;
  if (state.popup) {
    state.popup.remove();
    state.popup = null;
  }
}

export function showPopup(ctx, lngLat, feature) {
  const { map, maplibregl, state } = ctx;
  removePopup(ctx);

  const wrapper = document.createElement('div');
  wrapper.className = 'popup-card';

  const title = document.createElement('strong');
  title.textContent = feature.properties?.name ?? 'Map feature';

  const meta = document.createElement('span');
  meta.textContent = buildFeatureMeta(feature);

  wrapper.append(title, meta);

  state.popup = new maplibregl.Popup({
    closeButton: false,
    closeOnMove: true,
    offset: 18,
    maxWidth: '240px'
  })
    .setLngLat(lngLat)
    .setDOMContent(wrapper)
    .addTo(map);
}
