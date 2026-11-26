const sharp = require('sharp');

/**
 * Estimates whether an image suffers from blur or low resolution using Laplacian edge variance.
 */
async function assessImageQuality(imageBuffer) {
  const probe = sharp(imageBuffer).rotate();
  const meta = await probe.metadata();
  const width = meta.width || 800;
  const height = meta.height || 600;

  const evalBuf = await probe
    .clone()
    .resize({ width: Math.min(width, 640), withoutEnlargement: true })
    .grayscale()
    .convolve({
      width: 3,
      height: 3,
      kernel: [0, -1, 0, -1, 4, -1, 0, -1, 0]
    })
    .toBuffer();

  const [origStats, edgeStats] = await Promise.all([
    sharp(imageBuffer).rotate().grayscale().stats(),
    sharp(evalBuf).stats()
  ]);

  const edgeVariance = edgeStats.channels?.[0]?.stdev ?? 25;
  const meanBrightness = origStats.channels?.[0]?.mean ?? 180;
  const isLowRes = width < 1000 || height < 700;
  const isBlurry = edgeVariance < 20;
  const isDarkTheme = meanBrightness < 115;

  return {
    width,
    height,
    edgeVariance: Number(edgeVariance.toFixed(2)),
    meanBrightness: Number(meanBrightness.toFixed(1)),
    isLowRes,
    isBlurry,
    isDarkTheme
  };
}

/**
 * Cleans up, upscales, normalizes lighting, and deblurs an uploaded job screenshot/letter
 * before passing it to Vision AI or Tesseract OCR.
 *
 * @param {Buffer} imageBuffer
 * @param {string} originalMimeType
 */
async function enhanceImageForScanning(imageBuffer, originalMimeType = 'image/jpeg') {
  if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
    return null;
  }

  try {
    const quality = await assessImageQuality(imageBuffer);
    const { width, height, isLowRes, isBlurry, isDarkTheme } = quality;
    const operations = ['exif-orient'];

    // Target crisp typography scale while keeping latency low
    const visionTargetWidth = width < 1400
      ? Math.min(2000, Math.max(1400, width * 2))
      : Math.min(width, 2200);

    let visionPipeline = sharp(imageBuffer)
      .rotate()
      .resize({
        width: visionTargetWidth,
        kernel: sharp.kernel.lanczos3,
        withoutEnlargement: false
      });

    if (visionTargetWidth !== width) operations.push('lanczos3-upscale');

    visionPipeline = visionPipeline
      .normalise({ lower: 1, upper: 99 })
      .clahe({ width: 96, height: 96, maxSlope: 2 })
      .sharpen({
        sigma: isBlurry ? 1.8 : 1.15,
        m1: 0.4,
        m2: isBlurry ? 3.8 : 2.2,
        x1: 2,
        y2: 12,
        y3: 24
      });

    operations.push('contrast-normalize', 'local-clahe', isBlurry ? 'strong-unsharp-deblur' : 'unsharp-sharpen');

    const visionBuffer = await visionPipeline
      .png({ compressionLevel: 6 })
      .toBuffer();

    // OCR-tuned high-contrast black-on-white PNG for Tesseract fallback (clean background, no local CLAHE halos)
    const ocrTargetWidth = width < 1800
      ? Math.min(2400, Math.max(1800, width * 2))
      : Math.min(width, 2400);

    let ocrPipeline = sharp(imageBuffer)
      .rotate()
      .resize({
        width: ocrTargetWidth,
        kernel: sharp.kernel.lanczos3,
        withoutEnlargement: false
      })
      .grayscale();

    if (isDarkTheme) {
      ocrPipeline = ocrPipeline.negate({ alpha: false });
      operations.push('dark-mode-invert-ocr');
    }

    const ocrBuffer = await ocrPipeline
      .normalise({ lower: 2, upper: 98 })
      .sharpen({
        sigma: isBlurry ? 1.6 : 1.25,
        m1: 0.2,
        m2: isBlurry ? 3.5 : 2.4,
        x1: 2,
        y2: 14,
        y3: 28
      })
      .linear(1.12, -8)
      .png({ compressionLevel: 6 })
      .toBuffer();

    // Compact preview thumbnail for result UI ("Uploaded files" & "Message text")
    const previewBuf = await sharp(visionBuffer)
      .resize({ width: 960, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const enhancedMeta = await sharp(visionBuffer).metadata();

    return {
      visionBuffer,
      visionMimeType: 'image/png',
      ocrBuffer,
      previewDataUrl: `data:image/webp;base64,${previewBuf.toString('base64')}`,
      metadata: {
        applied: true,
        originalSize: `${width}x${height}`,
        enhancedSize: `${enhancedMeta.width || visionTargetWidth}x${enhancedMeta.height || height}`,
        wasBlurry: isBlurry,
        wasLowRes: isLowRes,
        wasDarkTheme: isDarkTheme,
        edgeVariance: quality.edgeVariance,
        operations
      }
    };
  } catch (err) {
    console.warn('⚠️ Image enhancement skipped (using original buffer):', err.message);
    return {
      visionBuffer: imageBuffer,
      visionMimeType: originalMimeType || 'image/jpeg',
      ocrBuffer: imageBuffer,
      previewDataUrl: null,
      metadata: {
        applied: false,
        reason: err.message
      }
    };
  }
}

module.exports = {
  enhanceImageForScanning,
  assessImageQuality
};
