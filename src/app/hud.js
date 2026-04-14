export function describeScale(zoom) {
  if (zoom < 2) {
    return 'Orbital';
  }
  if (zoom < 4) {
    return 'Continental';
  }
  if (zoom < 7) {
    return 'Regional';
  }
  if (zoom < 10) {
    return 'Metro';
  }
  if (zoom < 13.5) {
    return 'City';
  }
  return 'Street';
}

export function updateHud(ctx) {
  const { map, elements } = ctx;
  const center = map.getCenter();
  const zoom = map.getZoom();
  elements.zoomValue.textContent = zoom.toFixed(2);
  elements.zoomLabel.textContent = describeScale(zoom);
  elements.coordsValue.textContent = `${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`;
  elements.pitchValue.textContent = `${map.getPitch().toFixed(0)} deg`;
}
