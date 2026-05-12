import 'cesium/Build/Cesium/Widgets/widgets.css';
import './styles.css';

import '@shoelace-style/shoelace/dist/themes/dark.css';
import '@shoelace-style/shoelace/dist/shoelace-autoloader.js';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';
import { registerIconLibrary } from '@shoelace-style/shoelace/dist/utilities/icon-library.js';

import { renderAppShell } from './app/shell';
// @ts-ignore
import { boot } from './app/boot.js';

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
void boot().catch((e) => {
  try {
    // Surface fatal init errors on-screen so a blank page isn't silent.
    const d = document.createElement('div');
    d.style.cssText =
      'position:fixed;top:12px;left:12px;right:12px;z-index:99999;background:#b00020;color:#fff;padding:12px 14px;border-radius:10px;font:12px/1.35 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;box-shadow:0 12px 30px rgba(0,0,0,.35)';
    const msg = (e && (e.stack || e.message)) ? String(e.stack || e.message) : String(e);
    d.textContent = `Boot failed: ${msg}`;
    document.body.appendChild(d);
  } catch {}
  console.error('Boot failed:', e);
});
