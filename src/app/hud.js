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
  if (!map) return;
  
  const zoom = map.getZoom();
  if (elements.zoomValue) {
    elements.zoomValue.textContent = zoom.toFixed(zoom >= 10 ? 1 : 2);
  }
  
  if (elements.zoomLabel) {
    elements.zoomLabel.textContent = describeScale(zoom);
  }

  if (elements.pitchValue) {
    elements.pitchValue.textContent = `${map.getPitch().toFixed(0)}°`;
  }

  // Height: prefer Cesium's camera cartographic height (meters).
  try {
    if (elements.heightValue) {
      const hMeters = ctx.viewer?.scene?.camera?.positionCartographic?.height;
      if (Number.isFinite(hMeters)) {
        const km = hMeters / 1000;
        elements.heightValue.textContent = `${km.toFixed(km >= 1000 ? 0 : 1)} km`;
      } else {
        elements.heightValue.textContent = '-- km';
      }
    }
  } catch (e) {}
}
