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

  // Height: prefer Cesium's camera cartographic height (meters).
  try {
    const hMeters = ctx.viewer?.scene?.camera?.positionCartographic?.height;
    if (Number.isFinite(hMeters)) {
      const km = hMeters / 1000;
      elements.heightValue.textContent = `${km.toFixed(km >= 1000 ? 0 : 1)} km`;
    } else {
      elements.heightValue.textContent = '-- km';
    }
  } catch (e) {
    try {
      elements.heightValue.textContent = '-- km';
    } catch {}
  }
}
