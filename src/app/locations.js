import { FEATURED_LOCATIONS } from './constants.js';
import { removePopup } from './popups.js';

export function renderLocationButtons(ctx) {
  const { elements } = ctx;
  FEATURED_LOCATIONS.forEach((location) => {
    const btn = document.createElement('sl-button');
    btn.className = 'location-card-btn';
    btn.dataset.locationId = location.id;
    
    // We use a div inside the sl-button for custom multi-line content
    const content = document.createElement('div');
    content.className = 'btn-content';
    
    const title = document.createElement('strong');
    title.textContent = location.title;
    
    const note = document.createElement('span');
    note.textContent = location.note;
    
    content.append(title, note);
    btn.append(content);
    elements.locations.append(btn);
  });
}

export function addLocationMarker(ctx, location) {
  const { map, maplibregl } = ctx;
  const markerElement = document.createElement('button');
  markerElement.type = 'button';
  markerElement.className = 'city-marker';
  markerElement.setAttribute('aria-label', `Fly to ${location.title}`);
  markerElement.innerHTML = '<span></span>';
  markerElement.addEventListener('click', () => flyToLocation(ctx, location));

  new maplibregl.Marker({
    element: markerElement,
    anchor: 'center'
  })
    .setLngLat(location.center)
    .addTo(map);
}

export function flyToLocation(ctx, location) {
  const { map } = ctx;
  removePopup(ctx);
  map.flyTo({
    center: location.center,
    zoom: location.zoom,
    pitch: location.pitch,
    bearing: location.bearing,
    speed: 0.7,
    curve: 1.2,
    essential: true
  });
}

export function findLocationById(id) {
  return FEATURED_LOCATIONS.find((item) => item.id === id);
}
