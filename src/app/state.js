import { VIEW } from '../services/styleBundle.js';

export function createAppState() {
  return {
    currentView: VIEW.SATELLITE,
    projection: 'globe',
    lighting: 'day',
    realtimeLightingEnabled: false,
    terrainEnabled: false,
    terrainExaggeration: 1.15,
    labelsVisible: true,
    autoSpin: false,
    cloudsEnabled: false,
    cloudsAnimating: true,
    cloudsOpacity: 0.95,
    cloudsTimer: null,
    cloudsTime: null,
    atmosphereEnabled: true,
    interacting: false,
    spinTimeout: null,
    pendingTerrainUpdateRaf: null,
    pendingPitchUpdateRaf: null,
    overlayLayerIds: [],
    inspectableLayerIds: [],
    supportsCartographyToggle: true,
    popup: null
  };
}
