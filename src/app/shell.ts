export function renderAppShell() {
  document.body.classList.add('sl-theme-dark');

  const app = document.querySelector('#app');
  if (!app) {
    throw new Error('Missing #app root element');
  }

  app.innerHTML = `
    <div id="landing-page" class="landing-overlay">
      <div class="landing-scroll-container">
        <header id="landing-header" class="landing-header">
          <div class="header-inner">
            <h1 class="brand-logo">Twin Earth</h1>
            <button id="go-to-map-nav" class="btn-primary mini-btn">Go to map</button>
          </div>
        </header>

        <section class="hero-section">
          <div class="hero-content">
            <h1 class="brand-logo mega-logo">Twin Earth</h1>
            <p class="hero-tagline">A real-time 3D digital twin of Earth.</p>
            <button id="go-to-map-hero" class="btn-primary mega-btn">Go to map</button>
          </div>
        </section>

        <section class="content-section full-bleed-grid" id="about-idea">
          <div class="text-side">
            <h2 class="reveal-item">About the Idea</h2>
            <p class="reveal-item" style="--delay: 1">
              The Artemis II mission serves as a silent, powerful reminder of our place
              in the cosmos. As the Orion capsule arcs around the lunar far side,
              the view of Earth rising over the moon’s desolate horizon offers a
              perspective of profound fragility and interconnectedness. This project
              draws its life from that silver lunar light and the deep, velvet
              stillness of space.
            </p>
            <p class="reveal-item" style="--delay: 2">
              Every line and visual here is a tribute to that celestial journey. It
              is an attempt to capture the "overview effect"—that moment when
              borders vanish and all that remains is a radiant, swirling marble
              pulsing against the dark. This is a space built for those who still
              look up and find wonder in the reach toward the unknown.
            </p>
          </div>
          <div class="image-side reveal-item" style="--delay: 3">
            <img src="/src/assets/images/earth-from-artimis.png" alt="View of Earth from Lunar Orbit" class="artemis-full-img" />
          </div>
        </section>

        <section class="content-section full-bleed-grid" id="about-me">
          <div class="image-side reveal-item spec-sheet-side" style="--delay: 1">
            <img
              src="/src/assets/images/engg-spec-sheet.png"
              alt="Engineering specification sheet"
              class="artemis-full-img spec-sheet-cover"
            />
          </div>

          <div class="text-side">
            <h2 class="reveal-item">About Me</h2>
            <p class="reveal-item" style="--delay: 1">
              I’m a software engineer with an artistic heart and a chronic habit of
              over-engineering anything that moves. My work lives at the intersection
              of rigid logic and the expansive, quiet wonder of the night sky. I
              don't just build tools; I craft digital environments where technical
              precision meets a distinct visual soul.
            </p>
            <p class="reveal-item" style="--delay: 2">
              Whether I’m architecting a complex system or refining a
              micro-interaction, I treat every project like a mission to the stars.
              To me, "good enough" is a missed opportunity to reach a little further
              into the dark and pull back something brilliant.
            </p>

            <div class="about-links reveal-item" style="--delay: 3" aria-label="Contact links">
              <a class="icon-link" href="mailto:syedibrahimshah067@gmail.com" aria-label="Email syedibrahimshah067@gmail.com">
                <sl-icon name="envelope"></sl-icon>
                <span>syedibrahimshah067@gmail.com</span>
              </a>
              <a class="icon-link" href="https://instagram.com/syed_ahmedibrahim" target="_blank" rel="noreferrer" aria-label="Instagram syed_ahmedibrahim">
                <sl-icon name="instagram"></sl-icon>
                <span>syed_ahmedibrahim</span>
              </a>
              <a class="icon-link" href="https://github.com/father_hardstone" target="_blank" rel="noreferrer" aria-label="GitHub father_hardstone">
                <sl-icon name="github"></sl-icon>
                <span>father_hardstone</span>
              </a>
            </div>
          </div>
        </section>

        <footer class="landing-footer">
          <div class="container">
            <p>&copy; 2026 Twin Earth Project.</p>
            <p class="credit">
              Made by <a href="https://github.com/father-hardstone" target="_blank" rel="noreferrer">father-hardstone</a> on GitHub
            </p>
          </div>
        </footer>
      </div>
    </div>

    <div id="initial-loader" class="map-loader">
      <sl-spinner></sl-spinner>
      <span>Initializing Twin Earth...</span>
    </div>

    <div id="map" aria-label="Interactive 3D map of Earth"></div>

    <div class="nav-controls" aria-label="Navigation controls">
      <div class="nav-controls__group" role="group" aria-label="Zoom and rotation controls">
        <button id="btn-zoom-in" class="nav-controls__btn" type="button" aria-label="Zoom in">+</button>
        <button id="btn-zoom-out" class="nav-controls__btn" type="button" aria-label="Zoom out">−</button>
        <button id="btn-reset-north" class="nav-controls__btn" type="button" aria-label="Reset north">▲</button>
      </div>
      <button id="btn-fullscreen" class="nav-controls__btn nav-controls__btn--square" type="button" aria-label="Toggle fullscreen">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
          <path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm0-4h2V7h3V5H5v5zm10 9h-3v2h5v-5h-2v3zm0-14V7h-3v2h5V5h-2z"/>
        </svg>
      </button>
    </div>

    <div class="top-right-tools">
      <button id="btn-capture" class="tool-btn" aria-label="Capture View">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
          <path fill="currentColor" d="M9 4l-1.5 2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2.5L15 4H9zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2.2a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6z"/>
        </svg>
      </button>
      <button id="btn-lock-axis" class="tool-btn" aria-label="Toggle Fixed Axis">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
          <path fill="currentColor" d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 .001-16.001A8 8 0 0 1 12 20zm3.9-12.9l-5 2.1-2.1 5 5-2.1 2.1-5zm-4.1 6.9a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
        </svg>
      </button>
    </div>

    <button id="toggle-controls" class="controls-fab" aria-label="Toggle Controls">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path fill-rule="evenodd" d="M10.5 1a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V4H1.5a.5.5 0 0 1 0-1H10V1.5a.5.5 0 0 1 .5-.5M12 3.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5m-6.5 2A.5.5 0 0 1 6 6v1.5h8.5a.5.5 0 0 1 0 1H6V10a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5M1 8a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2A.5.5 0 0 1 1 8m9.5 2a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V13H1.5a.5.5 0 0 1 0-1H10v-1.5a.5.5 0 0 1 .5-.5m1.5 2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5"/>
      </svg>
    </button>

    <aside id="side-panel" class="panel glass">
      <header class="panel-header">
        <h1 id="back-to-landing" class="brand-logo brand-link">Twin Earth</h1>
        <button id="close-controls" class="panel-close" type="button" aria-label="Close controls">
          &times;
        </button>
      </header>

      <section class="compact-metrics" aria-label="Viewport status">
        <div class="metric-item">
          <span class="label">Scale:</span>
          <span id="zoom-label">Orbital</span>
        </div>
        <div class="metric-item">
          <span class="label">Zoom:</span>
          <span id="zoom-value">0.00</span>
        </div>
        <div class="metric-item">
          <span class="label">Height:</span>
          <span id="height-value">-- km</span>
        </div>
        <div class="metric-item">
          <span class="label">Center:</span>
          <span id="coords-value">0.00, 0.00</span>
        </div>
      </section>

      <section class="api-metrics" aria-label="Data sources and APIs">
        <div class="section-heading">
          <h2>APIs</h2>
        </div>
        <ul id="api-list" class="api-list"></ul>
      </section>

      <section class="control-group" aria-label="Scene controls">
        <div class="control-header">
          <span>Terrain exaggeration</span>
          <strong id="terrain-value">1.15x</strong>
        </div>
        <sl-range
          id="terrain-range"
          min="1"
          max="1.7"
          step="0.05"
          value="1.15"
        ></sl-range>

        <div class="control-header">
          <span>Camera pitch</span>
          <strong id="pitch-value">0 deg</strong>
        </div>
        <sl-range
          id="pitch-range"
          min="0"
          max="89"
          step="1"
          value="0"
        ></sl-range>
      </section>

      <section class="toggles-grid" aria-label="View controls">
        <div class="control-row">
          <span>Dark Matter View</span>
          <sl-switch id="view-dark"></sl-switch>
        </div>
        <hr class="separator" />
        <div class="control-row">
          <span>Globe Projection</span>
          <sl-switch id="proj-toggle" checked></sl-switch>
        </div>
        <div class="control-row">
          <span>Real-time Terminator</span>
          <sl-switch id="light-realtime"></sl-switch>
        </div>
        <div class="control-row" id="day-night-container">
          <span>Day / Night Lights</span>
          <sl-switch id="light-toggle"></sl-switch>
        </div>
        <hr class="separator" />
        <div class="control-row">
          <span>Cartography</span>
          <sl-switch id="labels-toggle"></sl-switch>
        </div>
        <div class="control-row">
          <span>Clouds</span>
          <sl-switch id="clouds-toggle"></sl-switch>
        </div>
        <div class="control-row">
          <span>Atmosphere</span>
          <sl-switch id="atmos-toggle" checked></sl-switch>
        </div>
        <div class="control-row">
          <span>Auto-spin</span>
          <sl-switch id="spin-toggle"></sl-switch>
        </div>
      </section>

      <section class="locations-section" aria-label="Featured fly-to locations">
        <div class="section-heading">
          <h2>Featured landings</h2>
        </div>
        <sl-button id="btn-geolocation" variant="primary" pill class="geo-btn">
          <sl-icon slot="prefix" name="geo-alt"></sl-icon>
          My Current Location
        </sl-button>
        <div id="locations" class="locations"></div>
      </section>

      <p class="helper">
        Scroll to zoom, right-drag to rotate, and hold <kbd>Ctrl</kbd> while
        dragging to tilt on desktop.
      </p>
    </aside>

    <div id="status" class="status glass" role="status" aria-live="polite">
      Loading Twin Earth...
    </div>
  `;
}
