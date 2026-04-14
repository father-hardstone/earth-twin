export function scheduleSpin(ctx) {
  const { map, state } = ctx;
  if (state.spinTimeout) {
    window.clearTimeout(state.spinTimeout);
  }

  if (!state.autoSpin || state.interacting || map.getZoom() > 3.6) {
    return;
  }

  state.spinTimeout = window.setTimeout(() => {
    const center = map.getCenter();
    map.easeTo({
      center: [center.lng - 12, center.lat],
      duration: 18000,
      easing: (value) => value,
      essential: true
    });
  }, 1200);
}
