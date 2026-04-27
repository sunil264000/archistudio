// Lightweight client-side image compression — keeps a consistent quality across all uploads
// so member avatars and portfolio covers feel uniform. Uses a canvas downscale to a target
// max edge and JPEG/WebP encoding. No external deps.

export interface CompressOptions {
  maxEdge?: number;        // longest side in px
  quality?: number;        // 0..1
  mimeType?: 'image/jpeg' | 'image/webp';
}

export async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
  const { maxEdge = 1600, quality = 0.82, mimeType = 'image/jpeg' } = opts;

  // Skip compression for tiny files (< 200KB) — already small enough
  if (!file.type.startsWith('image/')) return file;
  if (file.size < 200 * 1024 && file.type === mimeType) return file;

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  let { width, height } = img;
  const longest = Math.max(width, height);
  if (longest > maxEdge) {
    const ratio = maxEdge / longest;
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  // White background for JPEG encoding to avoid black on transparent PNGs
  if (mimeType === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(img, 0, 0, width, height);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, mimeType, quality)
  );
  if (!blob) return file;

  const ext = mimeType === 'image/webp' ? 'webp' : 'jpg';
  const baseName = file.name.replace(/\.[^.]+$/, '');
  return new File([blob], `${baseName}.${ext}`, { type: mimeType, lastModified: Date.now() });
}

// Square-crop avatar (1:1) at 512px for consistent profile photos
export async function compressAvatar(file: File): Promise<File> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });
  const size = 512;
  const minEdge = Math.min(img.width, img.height);
  const sx = (img.width - minEdge) / 2;
  const sy = (img.height - minEdge) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(img, sx, sy, minEdge, minEdge, 0, 0, size, size);
  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.85)
  );
  if (!blob) return file;
  const baseName = file.name.replace(/\.[^.]+$/, '');
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
}
