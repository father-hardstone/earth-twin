export function schedulePitchUpdate(ctx, pitch) {
  const { map, state } = ctx;
  if (state.pendingPitchUpdateRaf) {
    window.cancelAnimationFrame(state.pendingPitchUpdateRaf);
  }

  state.pendingPitchUpdateRaf = window.requestAnimationFrame(() => {
    state.pendingPitchUpdateRaf = null;
    try {
      map.jumpTo({ pitch });
    } catch (error) {
      console.warn('Pitch update failed:', error);
    }
  });
}
