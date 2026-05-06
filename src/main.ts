import 'maplibre-gl/dist/maplibre-gl.css';
import './styles.css';

import '@shoelace-style/shoelace/dist/themes/dark.css';
import '@shoelace-style/shoelace/dist/shoelace-autoloader.js';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';
import { registerIconLibrary } from '@shoelace-style/shoelace/dist/utilities/icon-library.js';

import { renderAppShell } from './app/shell';
import { boot } from './app';

// Use the CDN for Shoelace's lazy-loaded component bundles.
// This avoids 404s unless you also copy Shoelace assets into /public.
setBasePath('https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/');

// Use Bootstrap Icons for <sl-icon name="...">.
// This makes icons like "sliders" render correctly.
registerIconLibrary('default', {
  resolver: (name) =>
    `https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/${name}.svg`,
  mutator: (svg) => {
    svg.setAttribute('fill', 'currentColor');
  }
});

renderAppShell();
boot();

