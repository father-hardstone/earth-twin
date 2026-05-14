import {
  AWS_TERRARIUM_TILES,
  CARTO_DARK_MATTER_STYLE_URL,
  CARTO_POSITRON_STYLE_URL,
  ESRI_WORLD_IMAGERY_TILES,
  OPEN_FREEMAP_GLYPHS_URL,
  OPEN_FREEMAP_STYLE_URL
} from '../config/endpoints.js';

const API_ITEMS = [
  { name: 'OpenFreeMap style', url: OPEN_FREEMAP_STYLE_URL },
  { name: 'OpenFreeMap glyphs', url: OPEN_FREEMAP_GLYPHS_URL },
  { name: 'CARTO Positron', url: CARTO_POSITRON_STYLE_URL },
  { name: 'CARTO Dark Matter', url: CARTO_DARK_MATTER_STYLE_URL },
  { name: 'Esri World Imagery', url: ESRI_WORLD_IMAGERY_TILES?.[0] },
  { name: 'AWS Terrarium elevation', url: AWS_TERRARIUM_TILES?.[0] }
].filter((item) => typeof item.url === 'string' && item.url.length);

export function renderApiInfo(ctx) {
  const tickerEl = ctx?.elements?.apiTickerContent;
  if (!tickerEl) return;

  if (ctx.apiTickerInterval) {
    clearInterval(ctx.apiTickerInterval);
  }

  let index = 0;
  const updateTicker = () => {
    const item = API_ITEMS[index];
    if (!item) return;
    
    tickerEl.style.opacity = '0';
    setTimeout(() => {
      tickerEl.innerHTML = `<span class="ticker-name">${item.name}</span> <code class="ticker-url">${item.url}</code>`;
      tickerEl.style.opacity = '1';
    }, 400);

    index = (index + 1) % API_ITEMS.length;
  };

  updateTicker();
  ctx.apiTickerInterval = setInterval(updateTicker, 6000);
}

