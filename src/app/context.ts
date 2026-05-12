import { createAppState } from './state';
import { getDomRefs } from './dom';

export type AppContext = {
  state: ReturnType<typeof createAppState>;
  elements: ReturnType<typeof getDomRefs>;
  maplibregl: any;
  map: any;
  viewer?: any;
  renderer?: 'maplibre' | 'cesium';
  locationMarkers: any[];
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
    viewer: null,
    renderer: null,
    locationMarkers: [],
    atmosphereOverlayUnsub: null
  };
}
