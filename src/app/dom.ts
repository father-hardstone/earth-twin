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
  zoomLabel: HTMLElement;
  zoomValue: HTMLElement;
  heightValue: HTMLElement;
  coordsValue: HTMLElement;
  terrainRange: SlRange;
  terrainValue: HTMLElement;
  pitchRange: SlRange;
  pitchValue: HTMLElement;

  labelsToggle: SlSwitch;
  cloudsToggle: SlSwitch;
  atmosToggle: SlSwitch;
  spinToggle: SlSwitch;
  viewDark: SlSwitch;
  projToggle: SlSwitch;
  lightToggle: SlSwitch;
  lightRealtime: SlSwitch;

  sidePanel: HTMLElement;
  toggleControls: HTMLButtonElement;
  closeControls: HTMLButtonElement;
  landingPage: HTMLElement;
  landingHeader: HTMLElement;
  goToMapHeroBtn: HTMLButtonElement;
  goToMapNavBtn: HTMLButtonElement;
  backToLandingBtn: HTMLElement;
  btnGeolocation: SlButton;
  btnCapture: HTMLButtonElement;
  btnLockAxis: HTMLButtonElement;
  btnZoomIn: HTMLButtonElement;
  btnZoomOut: HTMLButtonElement;
  btnResetNorth: HTMLButtonElement;
  btnFullscreen: HTMLButtonElement;
  dayNightContainer: HTMLElement;

  locations: HTMLElement;
  apiList: HTMLElement;
};

export function getDomRefs(): DomRefs {
  return {
    status: req('#status'),
    zoomLabel: req('#zoom-label'),
    zoomValue: req('#zoom-value'),
    heightValue: req('#height-value'),
    coordsValue: req('#coords-value'),
    terrainRange: req('#terrain-range'),
    terrainValue: req('#terrain-value'),
    pitchRange: req('#pitch-range'),
    pitchValue: req('#pitch-value'),

    labelsToggle: req('#labels-toggle'),
    cloudsToggle: req('#clouds-toggle'),
    atmosToggle: req('#atmos-toggle'),
    spinToggle: req('#spin-toggle'),
    viewDark: req('#view-dark'),
    projToggle: req('#proj-toggle'),
    lightToggle: req('#light-toggle'),
    lightRealtime: req('#light-realtime'),

    sidePanel: req('#side-panel'),
    toggleControls: req('#toggle-controls'),
    closeControls: req('#close-controls'),
    landingPage: req('#landing-page'),
    landingHeader: req('#landing-header'),
    goToMapHeroBtn: req('#go-to-map-hero'),
    goToMapNavBtn: req('#go-to-map-nav'),
    backToLandingBtn: req('#back-to-landing'),
    btnGeolocation: req('#btn-geolocation'),
    btnCapture: req('#btn-capture'),
    btnLockAxis: req('#btn-lock-axis'),
    btnZoomIn: req('#btn-zoom-in'),
    btnZoomOut: req('#btn-zoom-out'),
    btnResetNorth: req('#btn-reset-north'),
    btnFullscreen: req('#btn-fullscreen'),
    dayNightContainer: req('#day-night-container'),

    locations: req('#locations'),
    apiList: req('#api-list')
  };
}
