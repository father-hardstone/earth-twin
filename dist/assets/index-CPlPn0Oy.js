const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/maplibre-gl-CxFj7W07.js","assets/rolldown-runtime-DF2fYuay.js","assets/maplibre-gl-B2k4QVOw.css"])))=>i.map(i=>d[i]);
import{n as e}from"./rolldown-runtime-DF2fYuay.js";import"./maplibre-gl-CxFj7W07.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var t=``;function n(e){t=e}function r(e=``){if(!t){let e=[...document.getElementsByTagName(`script`)],t=e.find(e=>e.hasAttribute(`data-shoelace`));if(t)n(t.getAttribute(`data-shoelace`));else{let t=e.find(e=>/shoelace(\.min)?\.js($|\?)/.test(e.src)||/shoelace-autoloader(\.min)?\.js($|\?)/.test(e.src)),r=``;t&&(r=t.getAttribute(`src`)),n(r.split(`/`).slice(0,-1).join(`/`))}}return t.replace(/\/$/,``)+(e?`/${e.replace(/^\//,``)}`:``)}var i=`modulepreload`,a=function(e){return`/`+e},o={},s=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),s=document.querySelector(`meta[property=csp-nonce]`),c=s?.nonce||s?.getAttribute(`nonce`);function l(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=l(t.map(t=>{if(t=a(t,n),t in o)return;o[t]=!0;let r=t.endsWith(`.css`),s=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${s}`))return;let l=document.createElement(`link`);if(l.rel=r?`stylesheet`:i,r||(l.as=`script`),l.crossOrigin=``,l.href=t,c&&l.setAttribute(`nonce`,c),document.head.appendChild(l),r)return new Promise((e,n)=>{l.addEventListener(`load`,e),l.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function s(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&s(e.reason);return e().catch(s)})},c=new MutationObserver(e=>{for(let{addedNodes:t}of e)for(let e of t)e.nodeType===Node.ELEMENT_NODE&&l(e)});async function l(e){let t=e instanceof Element?e.tagName.toLowerCase():``,n=t?.startsWith(`sl-`),r=[...e.querySelectorAll(`:not(:defined)`)].map(e=>e.tagName.toLowerCase()).filter(e=>e.startsWith(`sl-`));n&&!customElements.get(t)&&r.push(t);let i=[...new Set(r)];await Promise.allSettled(i.map(e=>u(e)))}function u(e){if(customElements.get(e))return Promise.resolve();let t=e.replace(/^sl-/i,``),n=r(`components/${t}/${t}.js`);return new Promise((t,r)=>{s(()=>import(n).then(()=>t()),[]).catch(()=>r(Error(`Unable to autoload <${e}> from ${n}`)))})}l(document.body),c.observe(document.documentElement,{subtree:!0,childList:!0});var d={name:`default`,resolver:e=>r(`assets/icons/${e}.svg`)},f={caret:`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  `,check:`
    <svg part="checked-icon" class="checkbox__icon" viewBox="0 0 16 16">
      <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" stroke-linecap="round">
        <g stroke="currentColor">
          <g transform="translate(3.428571, 3.428571)">
            <path d="M0,5.71428571 L3.42857143,9.14285714"></path>
            <path d="M9.14285714,0 L3.42857143,9.14285714"></path>
          </g>
        </g>
      </g>
    </svg>
  `,"chevron-down":`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
    </svg>
  `,"chevron-left":`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-left" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
    </svg>
  `,"chevron-right":`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-right" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
    </svg>
  `,copy:`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-copy" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2Zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6ZM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1H2Z"/>
    </svg>
  `,eye:`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16">
      <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
      <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
    </svg>
  `,"eye-slash":`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-slash" viewBox="0 0 16 16">
      <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
      <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
      <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
    </svg>
  `,eyedropper:`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eyedropper" viewBox="0 0 16 16">
      <path d="M13.354.646a1.207 1.207 0 0 0-1.708 0L8.5 3.793l-.646-.647a.5.5 0 1 0-.708.708L8.293 5l-7.147 7.146A.5.5 0 0 0 1 12.5v1.793l-.854.853a.5.5 0 1 0 .708.707L1.707 15H3.5a.5.5 0 0 0 .354-.146L11 7.707l1.146 1.147a.5.5 0 0 0 .708-.708l-.647-.646 3.147-3.146a1.207 1.207 0 0 0 0-1.708l-2-2zM2 12.707l7-7L10.293 7l-7 7H2v-1.293z"></path>
    </svg>
  `,"grip-vertical":`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-grip-vertical" viewBox="0 0 16 16">
      <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"></path>
    </svg>
  `,indeterminate:`
    <svg part="indeterminate-icon" class="checkbox__icon" viewBox="0 0 16 16">
      <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" stroke-linecap="round">
        <g stroke="currentColor" stroke-width="2">
          <g transform="translate(2.285714, 6.857143)">
            <path d="M10.2857143,1.14285714 L1.14285714,1.14285714"></path>
          </g>
        </g>
      </g>
    </svg>
  `,"person-fill":`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person-fill" viewBox="0 0 16 16">
      <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
    </svg>
  `,"play-fill":`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-play-fill" viewBox="0 0 16 16">
      <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"></path>
    </svg>
  `,"pause-fill":`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pause-fill" viewBox="0 0 16 16">
      <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"></path>
    </svg>
  `,radio:`
    <svg part="checked-icon" class="radio__icon" viewBox="0 0 16 16">
      <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g fill="currentColor">
          <circle cx="8" cy="8" r="3.42857143"></circle>
        </g>
      </g>
    </svg>
  `,"star-fill":`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star-fill" viewBox="0 0 16 16">
      <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
    </svg>
  `,"x-lg":`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
      <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
    </svg>
  `,"x-circle-fill":`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-circle-fill" viewBox="0 0 16 16">
      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"></path>
    </svg>
  `},p=[d,{name:`system`,resolver:e=>e in f?`data:image/svg+xml,${encodeURIComponent(f[e])}`:``}],m=[];function h(e,t){g(e),p.push({name:e,resolver:t.resolver,mutator:t.mutator,spriteSheet:t.spriteSheet}),m.forEach(t=>{t.library===e&&t.setIcon()})}function g(e){p=p.filter(t=>t.name!==e)}function _(){document.body.classList.add(`sl-theme-dark`);let e=document.querySelector(`#app`);if(!e)throw Error(`Missing #app root element`);e.innerHTML=`
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
          <span class="label">Center:</span>
          <span id="coords-value">0.00, 0.00</span>
        </div>
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
          max="80"
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
  `}var v=`https://tiles.openfreemap.org/styles/liberty`,ee=`https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf`,te=`https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`,ne=`https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`,y=[`https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png`],b=`satellite-imagery`,x=`terrain-dem`;function re(){return{type:`raster`,tiles:[`tilemgr://sat/{z}/{x}/{y}`],tileSize:256,maxzoom:19,attribution:`Imagery by Esri, Maxar, Earthstar Geographics, and the GIS user community`}}function S(){return{type:`raster-dem`,encoding:`terrarium`,tiles:y,tileSize:256,maxzoom:15,attribution:`Terrain by Mapzen and the AWS Public Dataset Program`}}var ie=`osm-3d-buildings`,C={SATELLITE:`satellite`,POSITRON:`positron`,DARK:`dark`};async function ae(e,t=!0){return e===C.POSITRON?ce(te,t):e===C.DARK?ce(ne,t):se(t)}function oe(){return{...ue(),statusMessage:`Map load is taking longer than expected, so this view is starting in satellite + terrain mode.`}}async function se(e){try{return le(await he(v),v,e)}catch(e){return console.warn(`Falling back to satellite + terrain only:`,e),{...ue(),statusMessage:`OpenStreetMap cartography is unavailable right now, so this view is satellite + terrain only.`}}}async function ce(e,t){let n=await he(e),r=S(),i={...n,sources:{...n.sources??{},[x]:r}};return{style:i,overlayLayerIds:[],inspectableLayerIds:de(i.layers??[]),supportsCartographyToggle:!1}}function le(e,t,n){let r=re(),i=S(),[a,o]=Object.entries(e.sources??{}).filter(([,e])=>e?.type===`vector`)[0]??[],s=o?_e(o,t):null,c=(e.layers??[]).filter(e=>e.source===a).filter(e=>pe(e)).map(e=>{let t=me(e);return{...t,layout:{...t.layout??{},visibility:n?`visible`:`none`}}}),l=c.filter(e=>e.type===`line`),u=c.filter(e=>e.type!==`line`),d=[...c.map(e=>e.id)],f=de(u),p=fe(a);return p.layout={...p.layout??{},visibility:`visible`},{style:{version:8,name:`Twin Earth Hybrid`,glyphs:ye(e.glyphs,t),sprite:ve(e.sprite,t),sources:{[b]:r,[x]:i,...s?{[a]:s}:{}},layers:[{id:b,type:`raster`,source:b,paint:{"raster-fade-duration":250,"raster-saturation":.08,"raster-contrast":.06}},...l,...s?[p]:[],...u]},overlayLayerIds:d,inspectableLayerIds:[ie,...f],supportsCartographyToggle:!0}}function ue(){let e=re(),t=S();return{style:{version:8,name:`Twin Earth Fallback`,sources:{[b]:e,[x]:t},layers:[{id:b,type:`raster`,source:b,paint:{"raster-fade-duration":250}}]},overlayLayerIds:[],inspectableLayerIds:[],supportsCartographyToggle:!1}}function de(e){return e.filter(e=>e?.type===`symbol`).filter(e=>typeof e.id==`string`).filter(e=>/(place|settlement|country|state|road|street|water)/i.test(e.id)).map(e=>e.id).slice(0,18)}function fe(e){return{id:ie,type:`fill-extrusion`,source:e,"source-layer":`building`,minzoom:13.5,filter:[`>`,[`to-number`,[`coalesce`,[`get`,`render_height`],[`get`,`height`],0]],0],paint:{"fill-extrusion-color":[`interpolate`,[`linear`],[`to-number`,[`coalesce`,[`get`,`render_height`],[`get`,`height`],0]],0,`#d8e3ef`,24,`#c7d4e0`,80,`#9db0c3`,180,`#6f879e`],"fill-extrusion-height":[`interpolate`,[`linear`],[`zoom`],13.5,0,14.2,[`to-number`,[`coalesce`,[`get`,`render_height`],[`get`,`height`],8]]],"fill-extrusion-base":[`interpolate`,[`linear`],[`zoom`],13.5,0,14.2,[`to-number`,[`coalesce`,[`get`,`render_min_height`],[`get`,`min_height`],0]]],"fill-extrusion-opacity":.92,"fill-extrusion-vertical-gradient":!0}}}function pe(e){if(!e?.source||!e.type||typeof e.id!=`string`)return!1;let t=e.id.toLowerCase();return e.type===`line`?/(road|street|motorway|path|rail|bridge|tunnel|boundary|admin|coast|waterway)/i.test(t):e.type===`symbol`?!/(poi|housenumber|aeroway|landcover|natural-point|transit)/i.test(t):!1}function me(e){let t=ge(e),n=t.id.toLowerCase();return t.type===`line`&&(t.minzoom=Math.max(t.minzoom??0,n.includes(`boundary`)?2:7)),t.type===`symbol`&&(t.paint={...t.paint,"text-halo-color":`#06111f`,"text-halo-width":[`interpolate`,[`linear`],[`zoom`],3,.8,8,1.1,14,1.8],"text-halo-blur":.4},/(road|street|transport)/i.test(n)&&(t.minzoom=Math.max(t.minzoom??0,11))),t}async function he(e){let t=await fetch(e);if(!t.ok)throw Error(`Failed to load ${e}: ${t.status}`);return t.json()}function ge(e){return JSON.parse(JSON.stringify(e))}function _e(e,t){let n=ge(e);return n.url&&=w(n.url,t),Array.isArray(n.tiles)&&(n.tiles=n.tiles.map(e=>w(e,t))),n}function w(e,t){if(!e)return e;try{return new URL(e,t).href}catch{return e}}function ve(e,t){if(!(typeof e!=`string`||!e.trim()))return w(e,t)}function ye(e,t){let n=ve(e,t);return typeof n==`string`&&n.includes(`{fontstack}`)&&n.includes(`{range}`)?n:ee}function be(){return{currentView:C.SATELLITE,projection:`globe`,lighting:`day`,realtimeLightingEnabled:!1,terrainEnabled:!1,terrainExaggeration:1.15,labelsVisible:!1,autoSpin:!1,cloudsEnabled:!1,cloudsAnimating:!0,cloudsOpacity:.95,cloudsTimer:null,cloudsTime:null,atmosphereEnabled:!0,interacting:!1,spinTimeout:null,pendingTerrainUpdateRaf:null,pendingPitchUpdateRaf:null,overlayLayerIds:[],inspectableLayerIds:[],supportsCartographyToggle:!0,popup:null}}function T(e){let t=document.querySelector(e);if(!t)throw Error(`Missing required element: ${e}`);return t}function xe(){return{status:T(`#status`),zoomLabel:T(`#zoom-label`),zoomValue:T(`#zoom-value`),coordsValue:T(`#coords-value`),terrainRange:T(`#terrain-range`),terrainValue:T(`#terrain-value`),pitchRange:T(`#pitch-range`),pitchValue:T(`#pitch-value`),labelsToggle:T(`#labels-toggle`),cloudsToggle:T(`#clouds-toggle`),atmosToggle:T(`#atmos-toggle`),spinToggle:T(`#spin-toggle`),viewDark:T(`#view-dark`),projToggle:T(`#proj-toggle`),lightToggle:T(`#light-toggle`),lightRealtime:T(`#light-realtime`),sidePanel:T(`#side-panel`),toggleControls:T(`#toggle-controls`),closeControls:T(`#close-controls`),landingPage:T(`#landing-page`),landingHeader:T(`#landing-header`),goToMapHeroBtn:T(`#go-to-map-hero`),goToMapNavBtn:T(`#go-to-map-nav`),backToLandingBtn:T(`#back-to-landing`),btnGeolocation:T(`#btn-geolocation`),dayNightContainer:T(`#day-night-container`),locations:T(`#locations`)}}function Se(){return{state:be(),elements:xe(),maplibregl:null,map:null,locationMarkers:[]}}var E=[{id:`new-york`,title:`Midtown Manhattan`,note:`Dense vertical street canyons`,center:[-73.9857,40.7484],zoom:16.4,pitch:72,bearing:18},{id:`tokyo`,title:`Shibuya Crossing`,note:`Ultra-dense urban fabric`,center:[139.7014,35.6595],zoom:16.1,pitch:70,bearing:-32},{id:`paris`,title:`Central Paris`,note:`Street grid + mid-rise blocks`,center:[2.2945,48.8584],zoom:15.8,pitch:68,bearing:-20},{id:`karachi`,title:`Clifton, Karachi`,note:`Coastal city-scale fly-in`,center:[67.0283,24.8138],zoom:15.2,pitch:64,bearing:14},{id:`rio`,title:`Rio de Janeiro`,note:`Terrain + dense city edge`,center:[-43.2105,-22.9519],zoom:14.8,pitch:72,bearing:42},{id:`sydney`,title:`Sydney Harbour`,note:`Waterfront skyline approach`,center:[151.2152,-33.8568],zoom:15.7,pitch:70,bearing:-36},{id:`arctic`,title:`Arctic Circle`,note:`North Pole visibility check`,center:[0,85],zoom:4,pitch:0,bearing:0}],Ce={"sky-color":`#081426`,"sky-horizon-blend":.55,"horizon-color":`#bfd4ff`,"horizon-fog-blend":.7,"fog-color":`#d8e6ff`,"fog-ground-blend":.14,"atmosphere-blend":[`interpolate`,[`linear`],[`zoom`],0,1,3,.92,7,.72,10,.22,12,0]};function we(e){return e<2?`Orbital`:e<4?`Continental`:e<7?`Regional`:e<10?`Metro`:e<13.5?`City`:`Street`}function D(e){let{map:t,elements:n}=e,r=t.getCenter(),i=t.getZoom();n.zoomValue.textContent=i.toFixed(2),n.zoomLabel.textContent=we(i),n.coordsValue.textContent=`${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}`,n.pitchValue.textContent=`${t.getPitch().toFixed(0)} deg`}function O(e){let{map:t,state:n}=e;if(!t.getSource(`terrain-dem`))return;let r=t.getZoom()>=2.8;if(r!==n.terrainEnabled)try{r?t.setTerrain({source:x,exaggeration:n.terrainExaggeration}):t.setTerrain(null),n.terrainEnabled=r}catch(e){console.warn(`Terrain toggle failed:`,e)}}function Te(e){let{map:t,state:n}=e;n.terrainEnabled&&(n.pendingTerrainUpdateRaf||=window.requestAnimationFrame(()=>{n.pendingTerrainUpdateRaf=null;try{t.setTerrain({source:x,exaggeration:n.terrainExaggeration})}catch(e){console.warn(`Terrain update failed:`,e)}}))}function k(e){let{map:t,state:n}=e;n.spinTimeout&&window.clearTimeout(n.spinTimeout),!(!n.autoSpin||n.interacting||t.getZoom()>3.6)&&(n.spinTimeout=window.setTimeout(()=>{let e=t.getCenter();t.easeTo({center:[e.lng-12,e.lat],duration:18e3,easing:e=>e,essential:!0})},1200))}function Ee(e){return e.properties?.class?`${e.layer.type} layer - ${String(e.properties.class).replaceAll(`_`,` `)}`:e.layer?.id?.replaceAll(`-`,` `)??`feature`}function A(e){let{state:t}=e;t.popup&&=(t.popup.remove(),null)}function De(e,t,n){let{map:r,maplibregl:i,state:a}=e;A(e);let o=document.createElement(`div`);o.className=`popup-card`;let s=document.createElement(`strong`);s.textContent=n.properties?.name??`Map feature`;let c=document.createElement(`span`);c.textContent=Ee(n),o.append(s,c),a.popup=new i.Popup({closeButton:!1,closeOnMove:!0,offset:18,maxWidth:`240px`}).setLngLat(t).setDOMContent(o).addTo(r)}function Oe(e){let{elements:t}=e;E.forEach(e=>{let n=document.createElement(`sl-button`);n.className=`location-card-btn`,n.dataset.locationId=e.id;let r=document.createElement(`div`);r.className=`btn-content`;let i=document.createElement(`strong`);i.textContent=e.title;let a=document.createElement(`span`);a.textContent=e.note,r.append(i,a),n.append(r),t.locations.append(n)})}function ke(e,t){let{map:n,maplibregl:r}=e,i=document.createElement(`button`);i.type=`button`,i.className=`city-marker`,i.setAttribute(`aria-label`,`Fly to ${t.title}`),i.innerHTML=`<span></span>`,i.addEventListener(`click`,()=>Ae(e,t));let a=new r.Marker({element:i,anchor:`center`}).setLngLat(t.center).addTo(n);return Array.isArray(e.locationMarkers)&&e.locationMarkers.push(a),a}function Ae(e,t){let{map:n}=e;A(e),n.flyTo({center:t.center,zoom:t.zoom,pitch:t.pitch,bearing:t.bearing,speed:.7,curve:1.2,essential:!0})}function je(e){return E.find(t=>t.id===e)}var j=`sim-clouds`,M=`sim-clouds-src`,N=`gibscloud`,P=34,Me=.85,Ne=1.4,F=12,Pe=8,Fe=.03,I=!1;function Ie(e,t,n){let r=Math.max(0,Math.min(9,e)),i=e-r,a=i>0?2**i:1,o=Math.floor(n/a),s=Math.floor(t/a),c=2**r,l=(o%c+c)%c,u=Math.max(0,Math.min(c-1,s)),d=new Date;return d.setUTCDate(d.getUTCDate()-1),`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=MODIS_Terra_CorrectedReflectance_TrueColor&STYLE=default&TILEMATRIXSET=GoogleMapsCompatible_Level9&TILEMATRIX=${r}&TILEROW=${u}&TILECOL=${l}&FORMAT=image/jpeg&TIME=${d.toISOString().slice(0,10)}`}function Le(e){let t=e.naturalWidth||e.width,n=e.naturalHeight||e.height,r=document.createElement(`canvas`);r.width=t,r.height=n;let i=r.getContext(`2d`);i.drawImage(e,0,0);let a=i.getImageData(0,0,t,n).data,o=e=>{let t=(e-P)/(255-P);return Math.max(0,Math.min(1,Me*Math.max(0,Math.min(1,t))**Ne))},s=new Uint8Array(t*n),c=0;for(let e=0;e<t*n;e++){let t=e*4;a[t]*.299+a[t+1]*.587+a[t+2]*.114>=P&&(s[e]=1,c++)}if(c<t*n*Fe)return i.clearRect(0,0,t,n),r;if(c===t*n)return r;let l=F+Pe,u=new Float32Array(t*n);u.fill(l+1);for(let e=0;e<t*n;e++)s[e]&&(u[e]=0);for(let e=0;e<n;e++){let n=e*t,r=l+1;for(let e=0;e<t;e++)r=u[n+e]===0?0:r+1,u[n+e]=Math.min(u[n+e],r);r=l+1;for(let e=t-1;e>=0;e--)r=u[n+e]===0?0:r+1,u[n+e]=Math.min(u[n+e],r)}for(let e=0;e<t;e++){let r=l+1;for(let i=0;i<n;i++)r=u[i*t+e]===0?0:r+1,u[i*t+e]=Math.min(u[i*t+e],r);r=l+1;for(let i=n-1;i>=0;i--)r=u[i*t+e]===0?0:r+1,u[i*t+e]=Math.min(u[i*t+e],r)}let d=i.createImageData(t,n),f=d.data;for(let e=0;e<n;e++)for(let r=0;r<t;r++){let i=e*t+r,c=i*4;if(s[i]){let e=o(a[c]*.299+a[c+1]*.587+a[c+2]*.114);f[c]=255,f[c+1]=255,f[c+2]=255,f[c+3]=Math.round(e*255);continue}let d=u[i];if(d>l){f[c]=f[c+1]=f[c+2]=f[c+3]=0;continue}let p=Math.ceil(d)+1,m=0,h=0,g=0,_=0,v=Math.max(0,r-p),ee=Math.min(t-1,r+p),te=Math.max(0,e-p),ne=Math.min(n-1,e+p);for(let e=te;e<=ne;e+=2)for(let n=v;n<=ee;n+=2)if(s[e*t+n]){let r=(e*t+n)*4;m+=a[r],h+=a[r+1],g+=a[r+2],_++}if(_===0){f[c]=f[c+1]=f[c+2]=f[c+3]=0;continue}m=Math.round(m/_),h=Math.round(h/_),g=Math.round(g/_);let y=1;d>F&&(y=1-(d-F)/Pe);let b=o(m*.299+h*.587+g*.114)*Math.max(0,Math.min(1,y));f[c]=255,f[c+1]=255,f[c+2]=255,f[c+3]=Math.round(b*255)}return i.putImageData(d,0,0),r}function Re(e){I||(I=!0,e.addProtocol(N,async(e,t)=>{let n=e.url.replace(`${N}://`,``).split(`/`),r=Ie(Number(n[0]),Number(n[1]),Number(n[2])),i=await fetch(r,{signal:t.signal});if(!i.ok)throw Error(`GIBS tile error: ${i.status}`);let a=await i.blob(),o=Le(await createImageBitmap(a));return{data:await(await new Promise(e=>o.toBlob(e,`image/png`))).arrayBuffer()}}))}function L(e,t){let{state:n,map:r}=e;n.cloudsEnabled=t,r&&(t?(Re(e.maplibregl),r.getZoom()<.95&&r.easeTo({zoom:1.05,duration:350,essential:!0}),ze(e),R(e)):Be(e))}function ze(e){let{map:t,state:n}=e;!t||!n.cloudsEnabled||(t.getSource(M)||t.addSource(M,{type:`raster`,tiles:[`${N}://{z}/{y}/{x}`],tileSize:256,maxzoom:9}),t.getLayer(j)||t.addLayer({id:j,type:`raster`,source:M,paint:{"raster-opacity":.88,"raster-resampling":`linear`,"raster-saturation":-.12,"raster-contrast":.1}},He(t)),R(e))}function Be(e){let{map:t}=e;t&&(t.getLayer(j)&&t.removeLayer(j),t.getSource(M)&&t.removeSource(M))}function R(e){let{map:t,state:n}=e;if(!t||!n.cloudsEnabled)return;let r=t.getZoom(),i=r>=.8&&r<=2.9,a=i?Ve(r)*Number(n.cloudsOpacity??1):0;t.getLayer(j)&&(t.setLayoutProperty(j,`visibility`,i?`visible`:`none`),t.setPaintProperty(j,`raster-opacity`,Math.min(1,a)))}function Ve(e){return e<.8?0:e<=1?.92*((e-.8)/.2):e<=2.4?.92:e<=2.9?.92*(1-(e-2.4)/.5):0}function He(e){return(e.getStyle()?.layers??[]).find(e=>e.type===`symbol`)?.id}var z=`gibs-city-lights`,B=`gibs-city-lights-layer`,Ue=`gibslights`,We=120*1e3,Ge=!1,V=null;function H(e){let{map:t,state:n}=e;if(!t)return;let r=t.getZoom()<=5.2;Ye(e,!1),r&&(n.realtimeLightingEnabled||n.lighting===`night`)?(Qe(e),qe(e),Je(e),Xe(t,B,!0)):Xe(t,B,!1)}function Ke(e){let{map:t}=e;t&&(t.getLayer(B)&&t.removeLayer(B),t.getSource(z)&&t.removeSource(z))}function qe(e){let{map:t,state:n}=e;if(!t)return;let r=n.realtimeLightingEnabled?Math.floor(Date.now()/We)*We:0;r!==V&&(V=r,t.getLayer(B)&&t.removeLayer(B),t.getSource(z)&&t.removeSource(z))}function Je(e){let{map:t}=e;if(!t||t.getLayer(B)||t.getSource(z))return;t.addSource(z,{type:`raster`,tiles:[`${Ue}://{z}/{y}/{x}?b=${V??0}&m=${e.state?.realtimeLightingEnabled?`rt`:`full`}`],tileSize:256,minzoom:1,maxzoom:8,attribution:`Night lights by NASA GIBS (VIIRS CityLights 2012)`});let n=Ze(t);t.addLayer({id:B,type:`raster`,source:z,minzoom:1,maxzoom:8,paint:{"raster-opacity":[`interpolate`,[`linear`],[`zoom`],1,.92,3,.78,5,.42,6,.22,8,.08],"raster-contrast":.35,"raster-brightness-min":.15,"raster-brightness-max":1,"raster-saturation":.2}},n)}function Ye(e,t){let{map:n}=e;if(n?.getLayer(`satellite-imagery`))try{n.setPaintProperty(b,`raster-saturation`,.08),n.setPaintProperty(b,`raster-contrast`,.06),n.setPaintProperty(b,`raster-brightness-min`,null),n.setPaintProperty(b,`raster-brightness-max`,null),n.setPaintProperty(b,`raster-opacity`,1)}catch{}}function Xe(e,t,n){e.getLayer(t)&&e.setLayoutProperty(t,`visibility`,n?`visible`:`none`)}function Ze(e){return(e.getStyle()?.layers??[]).find(e=>e.type===`symbol`)?.id}function Qe(e){let{maplibregl:t}=e;!t||Ge||(Ge=!0,t.addProtocol(Ue,async(e,t)=>{let{z:n,x:r,y:i,bucketMs:a,mode:o}=$e(e.url),s=`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_CityLights_2012/default//GoogleMapsCompatible_Level8/${n}/${i}/${r}.jpg`,c=await fetch(s,{signal:t.signal});if(!c.ok)throw Error(`GIBS lights tile error: ${c.status}`);let l=await c.blob(),u=nt(await createImageBitmap(l),n,i,r,a,o);return{data:await(await new Promise(e=>u.toBlob(e,`image/png`))).arrayBuffer()}}))}function $e(e){let[t,n]=e.replace(/^[a-z]+:\/\//i,``).split(`?`),r=t.split(`/`).filter(Boolean),i=Number(r[0]),a=Number(r[1]),o=Number(r[2]),s=et(n),c=tt(n),l=2**i;return{z:i,x:(o%l+l)%l,y:Math.max(0,Math.min(l-1,a)),bucketMs:s,mode:c}}function et(e){if(!e)return null;let t=new URLSearchParams(e).get(`b`);if(!t)return null;let n=Number(t);return Number.isFinite(n)?n:null}function tt(e){return e&&new URLSearchParams(e).get(`m`)===`rt`?`rt`:`full`}function nt(e,t,n,r,i,a){let o=e.naturalWidth||e.width,s=e.naturalHeight||e.height,c=document.createElement(`canvas`);c.width=o,c.height=s;let l=c.getContext(`2d`);l.drawImage(e,0,0);let u=l.getImageData(0,0,o,s),d=u.data;if(a===`rt`){let e=st(i?new Date(i):new Date);for(let i=0;i<s;i++)for(let a=0;a<o;a++){let c=(i*o+a)*4,l=ot(t,r,n,a/(o-1),i/(s-1)),u=rt(l.lat,l.lon,e);d[c+3]=Math.round(u*255)}}else for(let e=0;e<d.length;e+=4)d[e+3]=255;return l.putImageData(u,0,0),c}function rt(e,t,n){let r=at(e,t,n);return r>=-3?0:r<=-12?1:it(0,1,(-3-r)/9)}function it(e,t,n){let r=Math.max(0,Math.min(1,(n-e)/(t-e)));return r*r*(3-2*r)}function at(e,t,n){let r=U(e),i=U(t),a=U(n.lat),o=U(n.lon),s=Math.sin(r)*Math.sin(a)+Math.cos(r)*Math.cos(a)*Math.cos(i-o),c=Math.acos(Math.max(-1,Math.min(1,s)));return W(Math.PI/2-c)}function ot(e,t,n,r,i){let a=2**e,o=t+r,s=n+i;return{lon:o/a*360-180,lat:W(Math.atan(Math.sinh(Math.PI*(1-2*s/a))))}}function U(e){return e*Math.PI/180}function W(e){return e*180/Math.PI}function st(e){let t=(ct(e)-2451545)/36525,n=lt(280.46646+36000.76983*t+3032e-7*t*t),r=lt(357.52911+35999.05029*t-1537e-7*t*t),i=.016708634-42037e-9*t-1.267e-7*t*t,a=U(r),o=n+((1.914602-.004817*t-14e-6*t*t)*Math.sin(a)+(.019993-101e-6*t)*Math.sin(2*a)+289e-6*Math.sin(3*a)),s=125.04-1934.136*t,c=o-.00569-.00478*Math.sin(U(s)),l=23+(26+(21.448-t*(46.815+t*(59e-5-t*.001813)))/60)/60+.00256*Math.cos(U(s)),u=U(c),d=U(l),f=Math.sin(d)*Math.sin(u),p=Math.asin(f),m=Math.tan(d/2),h=m*m,g=4*W(h*Math.sin(2*U(n))-2*i*Math.sin(a)+4*i*h*Math.sin(a)*Math.cos(2*U(n))-.5*h*h*Math.sin(4*U(n))-1.25*i*i*Math.sin(2*a)),_=(720-(e.getUTCHours()*60+e.getUTCMinutes()+e.getUTCSeconds()/60+g)%1440)/4;return _>180&&(_-=360),_<-180&&(_+=360),{lat:W(p),lon:_}}function ct(e){return e.getTime()/864e5+2440587.5}function lt(e){let t=e%360;return t<0&&(t+=360),t}function ut(e){let{map:t,state:n,elements:r}=e,i=n.projection===`flat`||n.currentView===C.DARK;if(t){try{t.dragPan?.enable?.()}catch{}if(i){try{t.jumpTo({bearing:0,pitch:0})}catch{}try{t.dragRotate?.disable?.(),t.touchZoomRotate?.disableRotation?.()}catch{}r?.pitchRange&&(r.pitchRange.disabled=!0,r.pitchRange.value=0),r?.pitchValue&&(r.pitchValue.textContent=`0 deg`)}else r?.pitchRange&&(r.pitchRange.disabled=!1)}}function G(e){let{map:t,state:n}=e;if(!t||!t.isStyleLoaded())return;let r=n.projection===`flat`?`mercator`:`globe`;if((t.getProjection()?.type||`mercator`)!==r)try{t.setProjection({type:r})}catch(e){console.warn(`Failed to set projection:`,e)}if(typeof t.setSky==`function`){n.atmosphereEnabled?t.setSky(Ce):t.setSky({});try{let e=t.getStyle().layers.find(e=>e.type===`background`);e&&t.setPaintProperty(e.id,`background-opacity`,+!n.atmosphereEnabled)}catch{}}n.cloudsEnabled&&(L(e,!0),R(e)),H(e),ut(e)}function K(e,t){let{map:n,state:r}=e,i=t&&r.supportsCartographyToggle;r.overlayLayerIds.forEach(e=>{n.getLayer(e)&&n.setLayoutProperty(e,`visibility`,i?`visible`:`none`)}),Array.isArray(e.locationMarkers)&&e.locationMarkers.forEach(e=>{try{let t=e?.getElement?.();if(!t)return;t.setAttribute(`aria-hidden`,i?`false`:`true`),t.style.setProperty(`display`,i?`block`:`none`,`important`),t.style.setProperty(`visibility`,i?`visible`:`hidden`,`important`)}catch{}}),document.body.classList.toggle(`labels-hidden`,!i)}function q(e){let{state:t,elements:n}=e,r=t.labelsVisible&&t.supportsCartographyToggle;n.labelsToggle&&(n.labelsToggle.disabled=!t.supportsCartographyToggle,n.labelsToggle.checked=r)}function dt(e){let{state:t,elements:n}=e;n.viewSatellite&&(n.viewSatellite.checked=t.currentView===C.SATELLITE),n.viewDark&&(n.viewDark.checked=t.currentView===C.DARK)}function ft(e){let{state:t,elements:n}=e;n.projToggle&&(n.projToggle.checked=t.projection===`globe`)}function pt(e,t){let{map:n,state:r}=e;r.pendingPitchUpdateRaf&&window.cancelAnimationFrame(r.pendingPitchUpdateRaf),r.pendingPitchUpdateRaf=window.requestAnimationFrame(()=>{r.pendingPitchUpdateRaf=null;try{e.cameraController?.setPitch?e.cameraController.setPitch(t):n.jumpTo({pitch:t})}catch(e){console.warn(`Pitch update failed:`,e)}})}async function mt(e,t){let{map:n,state:r,elements:i}=e;if(t===r.currentView)return;r.currentView=t,dt(e),i.status.classList.remove(`is-hidden`),i.status.textContent=`Switching view...`,A(e),t===C.DARK&&(r.cloudsEnabled=!1,r.atmosphereEnabled=!1,r.realtimeLightingEnabled=!1,r.lighting=`day`,i.cloudsToggle&&(i.cloudsToggle.checked=!1),i.atmosToggle&&(i.atmosToggle.checked=!1),i.lightRealtime&&(i.lightRealtime.checked=!1),i.lightToggle&&(i.lightToggle.checked=!1));let a=await ae(t,r.labelsVisible);r.overlayLayerIds=a.overlayLayerIds,r.inspectableLayerIds=a.inspectableLayerIds,r.supportsCartographyToggle=a.supportsCartographyToggle,n.once(`style.load`,()=>{Be(e),Ke(e),G(e),O(e),K(e,r.labelsVisible),q(e),r.cloudsEnabled&&L(e,!0),H(e),i.status.textContent=a.statusMessage??`View updated.`,window.setTimeout(()=>i.status.classList.add(`is-hidden`),900)}),n.setStyle(a.style,{diff:!1})}function ht(e,t){let{elements:n,state:r}=e;n.goToMapHeroBtn&&n.goToMapHeroBtn.addEventListener(`click`,()=>{t.navigate(`/map`)}),n.goToMapNavBtn&&n.goToMapNavBtn.addEventListener(`click`,()=>{t.navigate(`/map`)}),n.backToLandingBtn.addEventListener(`click`,()=>{t.navigate(`/landing`)}),n.landingPage.addEventListener(`scroll`,()=>{let e=n.landingPage.scrollTop>100;n.landingHeader.classList.toggle(`scrolled`,e)});let i=e=>{n.sidePanel.classList.toggle(`is-hidden`,!e),n.toggleControls.style.display=e?`none`:``};n.toggleControls.addEventListener(`click`,()=>i(!0)),n.closeControls&&n.closeControls.addEventListener(`click`,()=>i(!1)),n.terrainRange.addEventListener(`sl-input`,t=>{e.map&&(r.terrainExaggeration=Number(t.target.value),n.terrainValue.textContent=`${r.terrainExaggeration.toFixed(2)}x`,Te(e))}),n.pitchRange.addEventListener(`sl-input`,t=>{if(!e.map)return;let r=Number(t.target.value);n.pitchValue.textContent=`${r.toFixed(0)} deg`,pt(e,r)});let a=()=>{if(!e.map)return;let t=n.lightRealtime.checked;r.realtimeLightingEnabled=t,t?(n.dayNightContainer.classList.add(`disabled`),n.lightToggle.disabled=!0):(n.dayNightContainer.classList.remove(`disabled`),n.lightToggle.disabled=!1,r.lighting=n.lightToggle.checked?`night`:`day`),H(e)};n.lightRealtime.addEventListener(`sl-change`,a),n.lightToggle.addEventListener(`sl-change`,t=>{e.map&&(r.lighting=t.target.checked?`night`:`day`,H(e))}),n.viewDark.addEventListener(`sl-change`,t=>{e.map&&mt(e,t.target.checked?C.DARK:C.SATELLITE)}),n.projToggle.addEventListener(`sl-change`,t=>{e.map&&(r.projection=t.target.checked?`globe`:`flat`,G(e),ft(e))}),n.labelsToggle.addEventListener(`sl-change`,t=>{e.map&&(r.labelsVisible=t.target.checked,K(e,r.labelsVisible),q(e))}),n.cloudsToggle.addEventListener(`sl-change`,t=>{e.map&&L(e,t.target.checked)}),n.atmosToggle.addEventListener(`sl-change`,t=>{e.map&&(r.atmosphereEnabled=t.target.checked,G(e))}),n.spinToggle.addEventListener(`sl-change`,t=>{e.map&&(r.autoSpin=t.target.checked,r.autoSpin?k(e):r.spinTimeout&&window.clearTimeout(r.spinTimeout))}),n.btnGeolocation.addEventListener(`click`,()=>{if(e.map){if(!navigator.geolocation){alert(`Geolocation is not supported by your browser`);return}n.btnGeolocation.loading=!0,navigator.geolocation.getCurrentPosition(t=>{let{longitude:r,latitude:i}=t.coords;e.map.flyTo({center:[r,i],zoom:14,pitch:0,speed:.8,essential:!0}),n.btnGeolocation.loading=!1,n.status.textContent=`Landed at your location.`,window.setTimeout(()=>n.status.classList.add(`is-hidden`),2e3)},e=>{n.btnGeolocation.loading=!1,alert(`Geolocation error: ${e.message}`)})}}),n.locations.addEventListener(`click`,t=>{let n=t.target.closest(`[data-location-id]`);if(!n)return;let r=je(n.dataset.locationId);r&&Ae(e,r)}),e.syncUiToState=()=>{a(),ft(e),dt(e),q(e),n.atmosToggle&&(n.atmosToggle.checked=r.atmosphereEnabled),n.cloudsToggle&&(n.cloudsToggle.checked=r.cloudsEnabled),n.spinToggle&&(n.spinToggle.checked=r.autoSpin)},e.map&&e.syncUiToState(),i(!1)}function gt(e){let{map:t,state:n,elements:r}=e;t.on(`movestart`,()=>{n.interacting=!0,n.spinTimeout&&window.clearTimeout(n.spinTimeout)}),t.on(`move`,()=>{D(e)}),t.on(`moveend`,()=>{n.interacting=!1,D(e),O(e),R(e),H(e),k(e)}),t.on(`pitchend`,()=>{r.pitchRange.value=t.getPitch().toFixed(0),r.pitchValue.textContent=`${t.getPitch().toFixed(0)} deg`}),t.on(`zoom`,()=>{D(e),R(e),H(e)}),t.on(`click`,r=>{let i=n.inspectableLayerIds.filter(e=>t.getLayer(e));if(!i.length)return;let a=t.queryRenderedFeatures(r.point,{layers:i});if(!a.length){A(e);return}let o=a.find(e=>e.properties?.name)??a[0];De(e,r.lngLat,o)})}var _t=`https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.3.0/dist/mapbox-gl-rtl-text.js`;function vt(e){if(!(!e||typeof e.setRTLTextPlugin!=`function`))try{e.setRTLTextPlugin(_t,()=>{},!0)}catch(e){console.warn(`RTL text plugin failed to load:`,e)}}function yt(e){let{elements:t}=e,n={"/landing":()=>{t.landingPage.classList.remove(`fade-out`)},"/map":()=>{t.landingPage.classList.add(`fade-out`)}},r=()=>{let e=window.location.pathname;n[e]?n[e]():(window.history.replaceState({},``,`/landing`),n[`/landing`]())};return window.addEventListener(`popstate`,r),r(),{navigate:e=>{window.history.pushState({},``,e),r()}}}function bt(){let e=document.documentElement;document.addEventListener(`mousemove`,t=>{let n=t.clientX/window.innerWidth,r=t.clientY/window.innerHeight;e.style.setProperty(`--mouse-x`,n.toFixed(3)),e.style.setProperty(`--mouse-y`,r.toFixed(3))}),document.querySelectorAll(`.brand-logo, .hero-tagline, #go-to-map-hero`).forEach(e=>{e.addEventListener(`mousemove`,t=>{let n=e.getBoundingClientRect(),r=(t.clientX-n.left)/n.width,i=(t.clientY-n.top)/n.height;e.style.setProperty(`--local-x`,(r*100).toFixed(2)+`%`),e.style.setProperty(`--local-y`,(i*100).toFixed(2)+`%`)}),e.addEventListener(`mouseleave`,()=>{e.style.setProperty(`--local-x`,`-100%`),e.style.setProperty(`--local-y`,`-100%`)})});let t=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting?e.target.classList.add(`is-visible`):e.target.classList.remove(`is-visible`)})},{threshold:.15,rootMargin:`0px 0px -50px 0px`});document.querySelectorAll(`.reveal-item`).forEach(e=>{t.observe(e)})}function J(e,t,n){let r=Math.max(0,Math.floor(e)),i=2**r;return{z:r,x:(Math.floor(t)%i+i)%i,y:Math.max(0,Math.min(i-1,Math.floor(n)))}}function Y(e){return`${e.z}/${e.x}/${e.y}`}function xt(e,t,n){let r=Math.max(-85.05112878,Math.min(85.05112878,t)),i=2**n,a=(e+180)/360*i,o=r*Math.PI/180;return{x:a,y:(1-Math.log(Math.tan(o)+1/Math.cos(o))/Math.PI)/2*i}}var St=class{maxBytes;bytes=0;map=new Map;head=null;tail=null;constructor(e){this.maxBytes=Math.max(0,Math.floor(e))}get currentBytes(){return this.bytes}get(e){let t=this.map.get(e);if(t)return this.touch(t.node),t.value}has(e){return this.map.has(e)}set(e,t,n){let r=Math.max(0,Math.floor(n)),i=this.map.get(e);if(i)this.bytes-=i.node.size,i.value=t,i.node.size=r,this.bytes+=r,this.touch(i.node);else{let n={key:e,size:r,prev:null,next:null};this.map.set(e,{value:t,node:n}),this.bytes+=r,this.unshift(n)}this.evictIfNeeded()}delete(e){let t=this.map.get(e);t&&(this.bytes-=t.node.size,this.remove(t.node),this.map.delete(e))}evictIfNeeded(){for(;this.tail&&this.bytes>this.maxBytes;)this.delete(this.tail.key)}touch(e){this.head!==e&&(this.remove(e),this.unshift(e))}unshift(e){e.prev=null,e.next=this.head,this.head&&(this.head.prev=e),this.head=e,this.tail||=e}remove(e){e.prev&&(e.prev.next=e.next),e.next&&(e.next.prev=e.prev),this.head===e&&(this.head=e.next),this.tail===e&&(this.tail=e.prev),e.prev=null,e.next=null}},Ct=`earthTwinTiles`,wt=2,X=`tiles`,Z=null;function Tt(){return Z||(Z=new Promise((e,t)=>{let n=indexedDB.open(Ct,wt);n.onupgradeneeded=()=>{let e=n.result;e.objectStoreNames.contains(X)&&e.deleteObjectStore(X),e.objectStoreNames.contains(X)||e.createObjectStore(X,{keyPath:`key`}).createIndex(`updatedAt`,`updatedAt`,{unique:!1})},n.onsuccess=()=>e(n.result),n.onerror=()=>t(n.error??Error(`IndexedDB open failed`))}),Z)}async function Et(e){let t=await Tt();return await new Promise((n,r)=>{let i=t.transaction(X,`readonly`).objectStore(X).get(e);i.onsuccess=()=>n(i.result??null),i.onerror=()=>r(i.error??Error(`IndexedDB get failed`))})}async function Dt(e,t,n){let r=await Tt(),i={key:Y(e),updatedAt:Date.now(),contentType:n,data:t};await new Promise((e,t)=>{let n=r.transaction(X,`readwrite`);n.oncomplete=()=>e(),n.onerror=()=>t(n.error??Error(`IndexedDB put tx failed`)),n.objectStore(X).put(i)})}var Ot={maxAttempts:3,baseDelayMs:400,maxDelayMs:4e3};function kt(e,t){return e<=0?Promise.resolve():new Promise((n,r)=>{let i=window.setTimeout(n,e);t&&(t.aborted?(window.clearTimeout(i),r(t.reason??new DOMException(`Aborted`,`AbortError`))):t.addEventListener(`abort`,()=>{window.clearTimeout(i),r(t.reason??new DOMException(`Aborted`,`AbortError`))},{once:!0}))})}async function At(e,t,n=Ot){let r=Math.max(1,Math.floor(n.maxAttempts)),i=null;for(let a=0;a<r;a++)try{let n=await fetch(e,{signal:t,cache:`no-store`});if(!n.ok)throw Error(`HTTP ${n.status}`);let r=(n.headers.get(`content-type`)??`application/octet-stream`).toLowerCase(),i=await n.arrayBuffer();if(!i||i.byteLength===0)throw Error(`Empty tile response`);if(!r.startsWith(`image/`))throw Error(`Unexpected content-type: ${r}`);return{data:i,contentType:r}}catch(e){if(i=e,t.aborted)throw e;await kt(Math.min(n.maxDelayMs,n.baseDelayMs*2**a),t)}throw i??Error(`Tile fetch failed`)}function Q(e){return`https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${e.z}/${e.y}/${e.x}`}function $(e){if(!e||e.byteLength<12)return!1;let t=new Uint8Array(e);return t[0]===137&&t[1]===80&&t[2]===78&&t[3]===71&&t[4]===13&&t[5]===10&&t[6]===26&&t[7]===10||t[0]===255&&t[1]===216||t[0]===82&&t[1]===73&&t[2]===70&&t[3]===70&&t[8]===87&&t[9]===69&&t[10]===66&&t[11]===80}var jt=class{memory;lastKnownGood;inFlight=new Map;queue=[];activeFetches=0;maxFetchConcurrency;onTileUpdated;failUntilByKey=new Map;hostFailUntil=new Map;constructor(e){this.memory=new St(e.memoryMaxBytes),this.lastKnownGood=new St(Math.floor(e.memoryMaxBytes*.35)),this.maxFetchConcurrency=Math.max(1,Math.floor(e.maxFetchConcurrency))}setOnTileUpdated(e){this.onTileUpdated=e}getExactCachedTile(e,t,n){let r=Y(J(e,t,n));return this.safeGet(this.memory,r)??this.safeGet(this.lastKnownGood,r)}async fetchTile(e,t,n,r){let i=J(e,t,n),a=Y(i);try{let e=await Et(a);if(e?.data&&e.data.byteLength>0&&$(e.data)){let t={data:e.data,contentType:e.contentType};return this.putMemory(a,t),this.putLastKnownGood(a,t),t}}catch{}try{let{data:e,contentType:t}=await At(Q(i),r),n={data:e,contentType:t};return this.putMemory(a,n),this.putLastKnownGood(a,n),Dt(i,e,t),this.failUntilByKey.delete(a),n}catch(r){this.failUntilByKey.set(a,Date.now()+2500);let i=this.getExactCachedTile(e,t,n);if(i)return i;throw r}}ensureTileAsync(e,t,n){let r=Y(J(e,t,n));if(this.memory.has(r)||this.inFlight.has(r))return;let i=Date.now(),a=this.failUntilByKey.get(r);if(a&&a>i)return;let o=new AbortController,s=(async()=>{try{let e=await Et(r);if(e?.data&&e.data.byteLength>0&&$(e.data)){let t={data:e.data,contentType:e.contentType};this.putMemory(r,t),this.putLastKnownGood(r,t),this.onTileUpdated?.(r);return}}catch{}this.queue.push(r),this.pumpQueue()})();this.inFlight.set(r,{controller:o,promise:s}),s.finally(()=>{this.inFlight.get(r)?.promise===s&&this.inFlight.delete(r)})}prefetch(e){for(let t of e)this.ensureTileAsync(t.z,t.x,t.y)}preseedBaseZooms(e=3){for(let t=0;t<=e;t++){let e=2**t;for(let n=0;n<e;n++)for(let r=0;r<e;r++)this.ensureTileAsync(t,n,r)}}pumpQueue(){for(;this.activeFetches<this.maxFetchConcurrency&&this.queue.length>0;){let e=this.queue.shift();if(this.memory.has(e)||this.inFlight.has(e))continue;this.activeFetches++;let t=new AbortController,n=this.fetchAndStore(e,t.signal).finally(()=>{this.activeFetches--,this.inFlight.delete(e),this.pumpQueue()});this.inFlight.set(e,{controller:t,promise:n})}}async fetchAndStore(e,t){if(!navigator.onLine){this.failUntilByKey.set(e,Date.now()+1500);return}let[n,r,i]=e.split(`/`),a=J(Number(n),Number(r),Number(i));try{let n=Q(a),r=new URL(n).host,i=this.hostFailUntil.get(r);if(i&&i>Date.now()){this.failUntilByKey.set(e,i);return}let{data:o,contentType:s}=await At(n,t),c={data:o,contentType:s};this.putMemory(e,c),this.putLastKnownGood(e,c),Dt(a,o,s),this.onTileUpdated?.(e),this.failUntilByKey.delete(e),this.hostFailUntil.delete(r)}catch{let t=Date.now()+2500;this.failUntilByKey.set(e,t);try{let e=Q(a),n=new URL(e).host,r=this.hostFailUntil.get(n)??0;this.hostFailUntil.set(n,Math.max(r,t))}catch{}}}putMemory(e,t){let n=t.data.byteLength;this.memory.set(e,t,n)}putLastKnownGood(e,t){this.lastKnownGood.set(e,t,t.data.byteLength)}safeGet(e,t){let n=e.get(t);if(n){if(!n.data||n.data.byteLength===0){e.delete(t);return}if(!$(n.data)){e.delete(t);return}return n}}},Mt=`tilemgr`,Nt=!1;function Pt(e){let t=e.replace(/^[a-z]+:\/\//i,``).split(`/`).filter(Boolean);return{z:Number(t[1]),x:Number(t[2]),y:Number(t[3])}}function Ft(e,t){!e||Nt||(Nt=!0,e.addProtocol(Mt,async(e,n)=>{let{z:r,x:i,y:a}=Pt(e.url),o=t.getExactCachedTile(r,i,a);return o?(t.ensureTileAsync(r,i,a),{data:o.data.slice(0)}):{data:(await t.fetchTile(r,i,a,n.signal)).data.slice(0)}}))}var It={padTiles:1};function Lt(e,t){let n=xt(e.west,e.north,t),r=xt(e.east,e.south,t);return{minX:Math.floor(Math.min(n.x,r.x)),maxX:Math.floor(Math.max(n.x,r.x)),minY:Math.floor(Math.min(n.y,r.y)),maxY:Math.floor(Math.max(n.y,r.y))}}function Rt(e,t={}){let n={...It,...t},r=e.getZoom?.()??0,i=Math.max(0,Math.min(19,Math.floor(r))),a=Math.min(19,i+1),o=e.getBounds?.();if(!o)return[];let s={west:o.getWest(),south:o.getSouth(),east:o.getEast(),north:o.getNorth()},c=[];for(let e of[i,a]){let t=Lt(s,e),r=n.padTiles;for(let n=t.minY-r;n<=t.maxY+r;n++)for(let i=t.minX-r;i<=t.maxX+r;i++){let t=J(e,i,n);c.push(t)}}for(let e=i-1;e>=0;e--){let t=Lt(s,e);for(let n=t.minY;n<=t.maxY;n++)for(let r=t.minX;r<=t.maxX;r++)c.push(J(e,r,n))}return c}function zt(e,t,n){return Math.max(t,Math.min(n,e))}function Bt(e){let{map:t}=e;if(!t)return;let n=t.getCanvas?.(),r=t.getCanvasContainer?.()??t.getContainer?.();if(!n||!r)return;try{t.dragRotate?.disable?.(),t.doubleClickZoom?.disable?.(),t.touchZoomRotate?.disableRotation?.(),t.dragPan?.enable?.()}catch{}let i=()=>e.state?.projection===`flat`||e.state?.currentView===`dark`;try{t.scrollZoom?.enable?.({around:`center`}),t.scrollZoom?.setWheelZoomRate?.(1/700),t.scrollZoom?.setZoomRate?.(1/160)}catch{}let a=t.getPitch(),o=0,s=!1,c=0,l=0,u=e=>{let n=Math.min(32,e-(l||e));l=e;let r=n/16;if(i()){a=0,o=0,t.jumpTo({pitch:0,bearing:0});return}o*=.88**r,a+=o*r,a=zt(a,0,85),t.jumpTo({pitch:a}),(s||Math.abs(o)>.01)&&(c=requestAnimationFrame(u))},d=()=>{l=0,cancelAnimationFrame(c),c=requestAnimationFrame(u)};e.cameraController={setPitch:e=>{if(i()){a=0,o=0;try{t.jumpTo({pitch:0,bearing:0})}catch{}return}a=zt(Number(e),0,85),o=0;try{t.jumpTo({pitch:a})}catch{}}};try{let t=Number(e.elements?.pitchRange?.value);Number.isFinite(t)&&e.cameraController.setPitch(t)}catch{}let f=!1,p=null,m=0;n.addEventListener(`contextmenu`,e=>e.preventDefault()),n.addEventListener(`pointerdown`,e=>{if(e.button===2){e.preventDefault(),f=!0,p=e.pointerId,m=e.clientY,s=!0;try{n.setPointerCapture(p)}catch{}d()}}),n.addEventListener(`pointermove`,e=>{if(!f||e.pointerId!==p)return;e.preventDefault();let t=e.clientY-m;m=e.clientY,i()||(o-=t*.04)});let h=()=>{f=!1,p=null,s=!1};n.addEventListener(`pointerup`,h),n.addEventListener(`pointercancel`,h)}async function Vt(){let t=Se(),{state:n,elements:r}=t;bt(),Oe(t),r.status.textContent=`Loading 3D renderer...`;let i=document.querySelector(`#initial-loader`),a=e=>{i&&!i.classList.contains(`is-hidden`)&&(i.classList.add(`is-hidden`),e&&(r.status.textContent=e),window.setTimeout(()=>r.status.classList.add(`is-hidden`),1800))};ht(t,yt(t)),t.maplibregl=(await s(()=>import(`./maplibre-gl-CxFj7W07.js`).then(t=>e(t.t(),1)),__vite__mapDeps([0,1,2]))).default,vt(t.maplibregl);let o=new jt({memoryMaxBytes:128*1024*1024,maxFetchConcurrency:12});Ft(t.maplibregl,o),o.preseedBaseZooms(3),r.status.textContent=`Loading Twin Earth...`;let c;try{c=await Promise.race([ae(n.currentView,n.labelsVisible),new Promise(e=>{window.setTimeout(()=>e(oe()),6500)})])}catch(e){console.warn(`Style bundle failed to load, using fallback style:`,e),c=oe()}n.overlayLayerIds=c.overlayLayerIds,n.inspectableLayerIds=c.inspectableLayerIds,n.supportsCartographyToggle=c.supportsCartographyToggle,c.statusMessage&&(r.status.textContent=c.statusMessage),await new Promise(requestAnimationFrame);let l=document.getElementById(`map`);if(!l)throw Error(`Missing #map element`);(l.clientWidth===0||l.clientHeight===0)&&(l.style.width=`100vw`,l.style.height=`100vh`);try{r.projToggle&&(n.projection=r.projToggle.checked||r.projToggle.hasAttribute(`checked`)?`globe`:`flat`),r.atmosToggle&&(n.atmosphereEnabled=r.atmosToggle.checked||r.atmosToggle.hasAttribute(`checked`))}catch{}let u=Number(r.pitchRange?.value??0);t.map=new t.maplibregl.Map({container:`map`,style:c.style,projection:{type:n.projection===`flat`?`mercator`:`globe`},center:[12,20],zoom:1.58,pitch:Number.isFinite(u)?u:0,bearing:0,minZoom:.8,maxZoom:18.8,hash:!0,antialias:!0,pixelRatio:Math.min(2.5,Math.max(2,window.devicePixelRatio||1)),renderWorldCopies:!0,maxPitch:85,cancelPendingTileRequestsWhileZooming:!0,transformRequest:e=>({url:e})});let{map:d,maplibregl:f}=t;t.syncUiToState&&t.syncUiToState(),Bt(t),d.once(`render`,()=>a()),d.once(`load`,()=>a()),d.once(`idle`,()=>a()),window.setTimeout(()=>a(`Twin Earth is ready.`),3e4),o.setOnTileUpdated(()=>{try{d.triggerRepaint()}catch{}}),d.on(`error`,e=>{try{let t={sourceId:e?.sourceId,tile:e?.tile,err:e?.error??e};console.warn(`MapLibre error:`,t),r.status.textContent=`Map error: check network / style endpoints.`;let n=document.querySelector(`#initial-loader`);n&&n.classList.add(`is-hidden`)}catch{}}),d.addControl(new f.NavigationControl({showCompass:!0,showZoom:!0,visualizePitch:!0}),`top-right`),d.addControl(new f.FullscreenControl,`top-right`),d.addControl(new f.ScaleControl({maxWidth:120,unit:`metric`}),`bottom-right`),gt(t);let p=(()=>{let e=0;return()=>{window.clearTimeout(e),e=window.setTimeout(()=>{try{let e=Rt(d,{padTiles:1});o.prefetch(e)}catch{}},120)}})();d.on(`moveend`,p),d.on(`zoomend`,p),d.on(`load`,()=>{G(t),ut(t),E.forEach(e=>ke(t,e)),K(t,n.labelsVisible),r.status.textContent=c.statusMessage??`Twin Earth is ready.`;let e=document.querySelector(`#initial-loader`);e&&e.classList.add(`is-hidden`),window.setTimeout(()=>{r.status.classList.add(`is-hidden`)},1800),D(t),O(t),k(t),p()})}n(`https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/`),h(`default`,{resolver:e=>`https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/${e}.svg`,mutator:e=>{e.setAttribute(`fill`,`currentColor`)}}),_(),Vt();