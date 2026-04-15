// 1x1 transparent PNG. MapLibre will scale it to tile size.
const TRANSPARENT_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/ev0G2sAAAAASUVORK5CYII=';

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export const PLACEHOLDER_PNG: ArrayBuffer = base64ToArrayBuffer(TRANSPARENT_PNG_BASE64);
export const PLACEHOLDER_CONTENT_TYPE = 'image/png';

