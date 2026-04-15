import { createAppState } from './state.js';
import { getDomRefs } from './dom.js';

/**
 * Shared runtime for the globe UI: DOM, map handles, and mutable app state.
 * Created once in boot(); modules receive this object instead of closed-over globals.
 */
export function createAppContext() {
  return {
    state: createAppState(),
    elements: getDomRefs(),
    maplibregl: null,
    map: null,
    locationMarkers: []
  };
}
