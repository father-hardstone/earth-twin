export function looksLikeImage(buf: ArrayBuffer): boolean {
  if (!buf || buf.byteLength < 12) return false;
  const b = new Uint8Array(buf);

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a
  ) {
    return true;
  }

  // JPEG: FF D8 ... FF (EOI later, but SOI is enough)
  if (b[0] === 0xff && b[1] === 0xd8) return true;

  // WebP: RIFF .... WEBP
  if (
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  ) {
    return true;
  }

  return false;
}

