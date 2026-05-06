/** Featured landing spots shown in the location rail and as map markers. */
export const FEATURED_LOCATIONS = [
  {
    id: 'new-york',
    title: 'Midtown Manhattan',
    note: 'Dense vertical street canyons',
    center: [-73.9857, 40.7484],
    zoom: 16.4,
    pitch: 72,
    bearing: 18
  },
  {
    id: 'tokyo',
    title: 'Shibuya Crossing',
    note: 'Ultra-dense urban fabric',
    center: [139.7014, 35.6595],
    zoom: 16.1,
    pitch: 70,
    bearing: -32
  },
  {
    id: 'paris',
    title: 'Central Paris',
    note: 'Street grid + mid-rise blocks',
    center: [2.2945, 48.8584],
    zoom: 15.8,
    pitch: 68,
    bearing: -20
  },
  {
    id: 'karachi',
    title: 'Clifton, Karachi',
    note: 'Coastal city-scale fly-in',
    center: [67.0283, 24.8138],
    zoom: 15.2,
    pitch: 64,
    bearing: 14
  },
  {
    id: 'rio',
    title: 'Rio de Janeiro',
    note: 'Terrain + dense city edge',
    center: [-43.2105, -22.9519],
    zoom: 14.8,
    pitch: 72,
    bearing: 42
  },
  {
    id: 'sydney',
    title: 'Sydney Harbour',
    note: 'Waterfront skyline approach',
    center: [151.2152, -33.8568],
    zoom: 15.7,
    pitch: 70,
    bearing: -36
  },
  {
    id: 'arctic',
    title: 'Arctic Circle',
    note: 'North Pole visibility check',
    center: [0, 85],
    zoom: 4,
    pitch: 0,
    bearing: 0
  }
];

/** MapLibre sky / atmosphere styling applied after each style load. */
export const SKY = {
  // More realistic "deep space" dark blue sky.
  'sky-color': '#040b15',
  'sky-horizon-blend': 0.5,
  'horizon-color': '#96d2ff',
  'horizon-fog-blend': 0.8,
  'fog-color': '#bfe1ff',
  'fog-ground-blend': 0.15,
  'atmosphere-blend': [
    'interpolate',
    ['linear'],
    ['zoom'],
    0,
    1,
    10,
    1,
    12,
    0.6,
    14,
    0
  ]
};
