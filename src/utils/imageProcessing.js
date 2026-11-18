/**
 * Canvas-based image processing utilities.
 * Algorithms mirror the original app.js exactly:
 *   - Luminance: R*0.299 + G*0.587 + B*0.114
 *   - Threshold: 128
 *   - Edge (Sobel): magnitude * 1.35
 *   - Max input width: 1280 px (downscale proportionally)
 */

const MAX_WIDTH = 1280;

export async function buildImageView(originalUrl, mode) {
  if (mode === 'original') return originalUrl;

  return new Promise((resolve, reject) => {
    const image = new Image();
    if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
      image.crossOrigin = 'anonymous';
    }
    image.onload = () => {
      const scale = Math.min(1, MAX_WIDTH / image.naturalWidth);
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      if (mode === 'blur') {
        ctx.filter = 'blur(2.2px)';
        ctx.drawImage(image, 0, 0, width, height);
      } else {
        ctx.drawImage(image, 0, 0, width, height);
        const frame = ctx.getImageData(0, 0, width, height);
        const { data } = frame;

        if (mode === 'grayscale' || mode === 'threshold') {
          for (let i = 0; i < data.length; i += 4) {
            const lum = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
            const val = mode === 'threshold' ? (lum > 128 ? 255 : 0) : lum;
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
          }
        } else if (mode === 'edges') {
          const grey = new Uint8ClampedArray(width * height);
          for (let p = 0, i = 0; i < data.length; p++, i += 4) {
            grey[p] = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
          }
          for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
              const p = y * width + x;
              const gx =
                -grey[p - width - 1] + grey[p - width + 1]
                - 2 * grey[p - 1] + 2 * grey[p + 1]
                - grey[p + width - 1] + grey[p + width + 1];
              const gy =
                -grey[p - width - 1] - 2 * grey[p - width] - grey[p - width + 1]
                + grey[p + width - 1] + 2 * grey[p + width] + grey[p + width + 1];
              const val = Math.min(255, Math.sqrt(gx * gx + gy * gy) * 1.35);
              const off = p * 4;
              data[off] = val;
              data[off + 1] = val;
              data[off + 2] = val;
            }
          }
        }
        ctx.putImageData(frame, 0, 0);
      }

      resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = () => reject(new Error('Source image could not be processed'));
    image.src = originalUrl;
  });
}

/** Run all pipeline stages: grayscale → blur → threshold → edges */
export async function runFullPipeline(originalUrl, onStage, cancelSignal) {
  const stages = ['grayscale', 'blur', 'threshold', 'edges'];
  for (const stage of stages) {
    if (cancelSignal.cancelled) return;
    const url = await buildImageView(originalUrl, stage);
    if (cancelSignal.cancelled) return;
    onStage(stage, url);
  }
}
