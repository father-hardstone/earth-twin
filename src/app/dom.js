export function getDomRefs() {
  return {
    status: document.querySelector('#status'),
    zoomLabel: document.querySelector('#zoom-label'),
    zoomValue: document.querySelector('#zoom-value'),
    coordsValue: document.querySelector('#coords-value'),
    terrainRange: document.querySelector('#terrain-range'),
    terrainValue: document.querySelector('#terrain-value'),
    pitchRange: document.querySelector('#pitch-range'),
    pitchValue: document.querySelector('#pitch-value'),
    
    // Switches
    labelsToggle: document.querySelector('#labels-toggle'),
    cloudsToggle: document.querySelector('#clouds-toggle'),
    atmosToggle: document.querySelector('#atmos-toggle'),
    spinToggle: document.querySelector('#spin-toggle'),
    viewDark: document.querySelector('#view-dark'),
    projToggle: document.querySelector('#proj-toggle'),
    lightToggle: document.querySelector('#light-toggle'),
    lightRealtime: document.querySelector('#light-realtime'),
    
    // Panel & Landing
    sidePanel: document.querySelector('#side-panel'),
    toggleControls: document.querySelector('#toggle-controls'),
    closeControls: document.querySelector('#close-controls'),
    landingPage: document.querySelector('#landing-page'),
    landingHeader: document.querySelector('#landing-header'),
    goToMapHeroBtn: document.querySelector('#go-to-map-hero'),
    goToMapNavBtn: document.querySelector('#go-to-map-nav'),
    backToLandingBtn: document.querySelector('#back-to-landing'),
    btnGeolocation: document.querySelector('#btn-geolocation'),
    dayNightContainer: document.querySelector('#day-night-container'),
    
    locations: document.querySelector('#locations')
  };
}
