import * as Cesium from 'cesium';

export function createSkyBox(sources) {
  return new Cesium.SkyBox({ sources });
}

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function buildDimmedSkyboxSources(baseSources, brightness) {
  const entries = await Promise.all(
    Object.entries(baseSources).map(async ([key, src]) => {
      const img = await loadImage(src);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const context2d = canvas.getContext('2d');
      context2d.drawImage(img, 0, 0);
      if (brightness <= 0) {
        context2d.fillStyle = 'black';
        context2d.fillRect(0, 0, canvas.width, canvas.height);
      } else if (brightness < 1) {
        context2d.fillStyle = `rgba(0, 0, 0, ${1 - brightness})`;
        context2d.fillRect(0, 0, canvas.width, canvas.height);
      }
      return [key, canvas];
    })
  );
  return Object.fromEntries(entries);
}

export async function buildSkyboxFadeSources(baseSources, levels, minBrightness = 0.1) {
  const list = [];
  for (let i = 0; i <= levels; i++) {
    const t = minBrightness + (1 - minBrightness) * (i / levels);
    const sources = await buildDimmedSkyboxSources(baseSources, t);
    list.push(sources);
  }
  return list;
}
