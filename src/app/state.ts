import { VIEW } from '../services/styleBundle.js';

export type AppState = {
  currentView: (typeof VIEW)[keyof typeof VIEW];
  projection: 'globe' | 'flat';
  lighting: 'day' | 'night';
  realtimeLightingEnabled: boolean;
  terrainEnabled: boolean;
  buildingsEnabled: boolean;
  waterMaskEnabled: boolean;
  terrainExaggeration: number;
  labelsVisible: boolean;
  autoSpin: boolean;
  cloudsEnabled: boolean;
  cloudsAnimating: boolean;
  cloudsOpacity: number;
  cloudsTimer: number | null;
  cloudsTime: number | null;
  atmosphereEnabled: boolean;
  interacting: boolean;
  spinTimeout: number | null;
  pendingTerrainUpdateRaf: number | null;
  pendingPitchUpdateRaf: number | null;
  overlayLayerIds: string[];
  inspectableLayerIds: string[];
  supportsCartographyToggle: boolean;
  isFlipping: boolean;
  popup: unknown;
  fixedAxis: boolean;
  fov: number;
};

export function createAppState(): AppState {
  return {
    currentView: VIEW.SATELLITE,
    projection: 'globe',
    lighting: 'day',
    realtimeLightingEnabled: false,
    terrainEnabled: false,
    buildingsEnabled: false,
    waterMaskEnabled: false,
    terrainExaggeration: 1.15,
    labelsVisible: false,
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
    isFlipping: false,
    popup: null,
    fixedAxis: false,
    fov: 60
  };
}
