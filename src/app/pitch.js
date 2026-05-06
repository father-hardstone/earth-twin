export function schedulePitchUpdate(ctx, pitch) {
  const { map, state } = ctx;
  if (state.pendingPitchUpdateRaf) {
    window.cancelAnimationFrame(state.pendingPitchUpdateRaf);
  }

  state.pendingPitchUpdateRaf = window.requestAnimationFrame(() => {
    state.pendingPitchUpdateRaf = null;
    try {
      if (ctx.cameraController?.setPitch) {
        ctx.cameraController.setPitch(pitch);
      } else {
        map.jumpTo({ pitch });
      }
    } catch (error) {
      console.warn('Pitch update failed:', error);
    }
  });
}
