type SlSwitch = HTMLElement & { checked: boolean; disabled: boolean };
type SlRange = HTMLElement & { value: number | string };
type SlButton = HTMLElement & { loading?: boolean };

function req<T extends Element>(selector: string): T {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`Missing required element: ${selector}`);
  return el as T;
}

export type DomRefs = {
  status: HTMLElement;
  zoomValue: HTMLElement;
  pitchValue: HTMLElement;
  fovValue: HTMLElement;
  coordsDms: HTMLElement;
  
  inputLat: HTMLInputElement;
  inputLng: HTMLInputElement;
  inputPlace: HTMLInputElement;
  btnPinLocation: HTMLButtonElement;
  
  btnResetZoom: HTMLButtonElement;
  btnResetPitch: HTMLButtonElement;
  btnResetFov: HTMLButtonElement;

  zoomRange: SlRange;
  pitchRange: SlRange;
  fovRange: SlRange;

  cloudsToggle: SlSwitch;
  atmosToggle: SlSwitch;
  spinToggle: SlSwitch;
  viewDark: SlSwitch;
  projToggle: SlSwitch;
  lightToggle: SlSwitch;
  lightRealtime: SlSwitch;
  terrainToggle: SlSwitch;
  buildingsToggle: SlSwitch;
  waterToggle: SlSwitch;

  sidePanel: HTMLElement;
  toggleControls: HTMLButtonElement;
  closeControls: HTMLButtonElement;
  landingPage: HTMLElement;
  landingHeader: HTMLElement;
  goToMapHeroBtn: HTMLButtonElement;
  goToMapNavBtn: HTMLButtonElement;
  backToLandingBtn: HTMLElement;
  btnCapture: HTMLButtonElement;
  btnLockAxis: HTMLButtonElement;
  btnZoomIn: HTMLButtonElement;
  btnZoomOut: HTMLButtonElement;
  btnResetNorth: HTMLButtonElement;
  btnFullscreen: HTMLButtonElement;
  dayNightContainer: HTMLElement;

  locations: HTMLElement;
  apiTickerContent: HTMLElement;
  fpsMonitor: HTMLElement;
};

export function getDomRefs(): DomRefs {
  return {
    status: req('#status'),
    zoomValue: req('#zoom-value'),
    pitchValue: req('#pitch-value'),
    fovValue: req('#fov-value'),
    coordsDms: req('#coords-dms'),

    inputLat: req('#input-lat'),
    inputLng: req('#input-lng'),
    inputPlace: req('#input-place'),
    btnPinLocation: req('#btn-pin-location'),

    btnResetZoom: req('#btn-reset-zoom'),
    btnResetPitch: req('#btn-reset-pitch'),
    btnResetFov: req('#btn-reset-fov'),

    zoomRange: req('#zoom-range'),
    pitchRange: req('#pitch-range'),
    fovRange: req('#fov-range'),

    cloudsToggle: req('#clouds-toggle'),
    atmosToggle: req('#atmos-toggle'),
    spinToggle: req('#spin-toggle'),
    viewDark: req('#view-dark'),
    projToggle: req('#proj-toggle'),
    lightToggle: req('#light-toggle'),
    lightRealtime: req('#light-realtime'),
    terrainToggle: req('#terrain-toggle'),
    buildingsToggle: req('#buildings-toggle'),
    waterToggle: req('#water-toggle'),

    sidePanel: req('#side-panel'),
    toggleControls: req('#toggle-controls'),
    closeControls: req('#close-controls'),
    landingPage: req('#landing-page'),
    landingHeader: req('#landing-header'),
    goToMapHeroBtn: req('#go-to-map-hero'),
    goToMapNavBtn: req('#go-to-map-nav'),
    backToLandingBtn: req('#back-to-landing'),
    btnCapture: req('#btn-capture'),
    btnLockAxis: req('#btn-lock-axis'),
    btnZoomIn: req('#btn-zoom-in'),
    btnZoomOut: req('#btn-zoom-out'),
    btnResetNorth: req('#btn-reset-north'),
    btnFullscreen: req('#btn-fullscreen'),
    dayNightContainer: req('#day-night-container'),

    locations: req('#locations'),
    apiTickerContent: req('#api-ticker-content'),
    fpsMonitor: req('#fps-monitor')
  };
}
