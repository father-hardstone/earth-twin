import type { Marker } from 'maplibre-gl';
import { createAppState } from './state';
import { getDomRefs } from './dom';

export type AppContext = {
  state: ReturnType<typeof createAppState>;
  elements: ReturnType<typeof getDomRefs>;
  maplibregl: any;
  map: any;
  locationMarkers: Marker[];
  atmosphereOverlayUnsub?: (() => void) | null;
};

/**
 * Shared runtime for the globe UI: DOM, map handles, and mutable app state.
 * Created once in boot(); modules receive this object instead of closed-over globals.
 */
export function createAppContext(): AppContext {
  return {
    state: createAppState(),
    elements: getDomRefs(),
    maplibregl: null,
    map: null,
    locationMarkers: [],
    atmosphereOverlayUnsub: null
  };
}
