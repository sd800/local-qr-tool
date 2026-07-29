type CameraCapabilities = MediaTrackCapabilities & {
  focusMode?: string[];
  sharpness?: MediaSettingsRange;
};

type CameraConstraintSet = MediaTrackConstraintSet & {
  focusMode?: string;
  sharpness?: number;
};

const CAMERA_FRAME_MAX_DIMENSION = 1120;
const IMAGE_FRAME_MAX_DIMENSION = 2200;

function clampByte(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function makeCanvas(
  source: HTMLImageElement | HTMLVideoElement,
  sourceWidth: number,
  sourceHeight: number,
  maxDimension: number,
  upscaleSmallImages: boolean,
) {
  if (!sourceWidth || !sourceHeight) return null;

  const longestSide = Math.max(sourceWidth, sourceHeight);
  const maximumScale = maxDimension / longestSide;
  const scale = upscaleSmallImages
    ? Math.min(
        maximumScale,
        longestSide < 600 ? 3 : longestSide < 1100 ? 2 : 1,
      )
    : Math.min(maximumScale, 1);
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, width, height);
  return canvas;
}

function getContrastBounds(histogram: Uint32Array, total: number) {
  const lowerTarget = total * 0.015;
  const upperTarget = total * 0.985;
  let cumulative = 0;
  let low = 0;
  let high = 255;

  for (let value = 0; value < histogram.length; value += 1) {
    cumulative += histogram[value];
    if (cumulative >= lowerTarget) {
      low = value;
      break;
    }
  }

  cumulative = 0;
  for (let value = histogram.length - 1; value >= 0; value -= 1) {
    cumulative += histogram[value];
    if (total - cumulative <= upperTarget) {
      high = value;
      break;
    }
  }

  return high - low >= 8 ? { low, high } : { low: 0, high: 255 };
}

function getOtsuThreshold(values: Uint8ClampedArray) {
  const histogram = new Uint32Array(256);
  let totalValue = 0;

  for (const value of values) {
    histogram[value] += 1;
    totalValue += value;
  }

  let backgroundWeight = 0;
  let backgroundValue = 0;
  let bestVariance = -1;
  let threshold = 127;

  for (let value = 0; value < histogram.length; value += 1) {
    backgroundWeight += histogram[value];
    if (!backgroundWeight) continue;

    const foregroundWeight = values.length - backgroundWeight;
    if (!foregroundWeight) break;

    backgroundValue += value * histogram[value];
    const backgroundMean = backgroundValue / backgroundWeight;
    const foregroundMean =
      (totalValue - backgroundValue) / foregroundWeight;
    const meanDifference = backgroundMean - foregroundMean;
    const variance =
      backgroundWeight * foregroundWeight * meanDifference * meanDifference;

    if (variance > bestVariance) {
      bestVariance = variance;
      threshold = value;
    }
  }

  return threshold;
}

function sharpenValues(
  source: Uint8ClampedArray,
  width: number,
  height: number,
  strength: number,
) {
  const sharpened = new Uint8ClampedArray(source);

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const pixel = y * width + x;
      const edge =
        source[pixel] * 4 -
        source[pixel - 1] -
        source[pixel + 1] -
        source[pixel - width] -
        source[pixel + width];
      sharpened[pixel] = clampByte(source[pixel] + strength * edge);
    }
  }

  return sharpened;
}

function createGrayscaleCanvas(
  values: Uint8ClampedArray,
  width: number,
  height: number,
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const image = context.createImageData(width, height);

  for (let pixel = 0; pixel < values.length; pixel += 1) {
    const offset = pixel * 4;
    const value = values[pixel];
    image.data[offset] = value;
    image.data[offset + 1] = value;
    image.data[offset + 2] = value;
    image.data[offset + 3] = 255;
  }

  context.putImageData(image, 0, 0);
  return canvas;
}

function createThresholdCanvas(
  values: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number,
  inverted = false,
) {
  const binary = new Uint8ClampedArray(values.length);
  for (let pixel = 0; pixel < values.length; pixel += 1) {
    const isDark = values[pixel] <= threshold;
    binary[pixel] = isDark !== inverted ? 0 : 255;
  }
  return createGrayscaleCanvas(binary, width, height);
}

function createAdaptiveThresholdValues(
  values: Uint8ClampedArray,
  width: number,
  height: number,
  globalThreshold: number,
) {
  const blockSize = Math.max(
    18,
    Math.min(44, Math.round(Math.min(width, height) / 70)),
  );
  const blocksAcross = Math.ceil(width / blockSize);
  const blocksDown = Math.ceil(height / blockSize);
  const sums = new Float64Array(blocksAcross * blocksDown);
  const counts = new Uint32Array(blocksAcross * blocksDown);

  for (let y = 0; y < height; y += 1) {
    const blockY = Math.floor(y / blockSize);
    for (let x = 0; x < width; x += 1) {
      const block = blockY * blocksAcross + Math.floor(x / blockSize);
      sums[block] += values[y * width + x];
      counts[block] += 1;
    }
  }

  const localThresholds = new Float32Array(sums.length);
  for (let blockY = 0; blockY < blocksDown; blockY += 1) {
    for (let blockX = 0; blockX < blocksAcross; blockX += 1) {
      let localSum = 0;
      let localCount = 0;
      for (
        let neighborY = Math.max(0, blockY - 1);
        neighborY <= Math.min(blocksDown - 1, blockY + 1);
        neighborY += 1
      ) {
        for (
          let neighborX = Math.max(0, blockX - 1);
          neighborX <= Math.min(blocksAcross - 1, blockX + 1);
          neighborX += 1
        ) {
          const neighbor = neighborY * blocksAcross + neighborX;
          localSum += sums[neighbor];
          localCount += counts[neighbor];
        }
      }

      const localMean = localCount ? localSum / localCount : globalThreshold;
      localThresholds[blockY * blocksAcross + blockX] =
        localMean * 0.72 + globalThreshold * 0.28 - 5;
    }
  }

  const adaptive = new Uint8ClampedArray(values.length);
  for (let y = 0; y < height; y += 1) {
    const blockY = Math.floor(y / blockSize);
    for (let x = 0; x < width; x += 1) {
      const pixel = y * width + x;
      const block = blockY * blocksAcross + Math.floor(x / blockSize);
      adaptive[pixel] = values[pixel] <= localThresholds[block] ? 0 : 255;
    }
  }

  return adaptive;
}

function createEnhancedCanvases(
  source: HTMLCanvasElement,
  intensive = false,
) {
  const context = source.getContext("2d", { willReadFrequently: true });
  if (!context) return [];

  const { width, height } = source;
  const sourceData = context.getImageData(0, 0, width, height);
  const pixelCount = width * height;
  const grayscale = new Uint8ClampedArray(pixelCount);
  const histogram = new Uint32Array(256);

  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const offset = pixel * 4;
    const value = clampByte(
      sourceData.data[offset] * 0.299 +
        sourceData.data[offset + 1] * 0.587 +
        sourceData.data[offset + 2] * 0.114,
    );
    grayscale[pixel] = value;
    histogram[value] += 1;
  }

  const { low, high } = getContrastBounds(histogram, pixelCount);
  const contrastScale = 255 / Math.max(1, high - low);
  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    grayscale[pixel] = clampByte((grayscale[pixel] - low) * contrastScale);
  }

  const sharpenedValues = sharpenValues(grayscale, width, height, 0.58);
  const sharpenedCanvas = createGrayscaleCanvas(
    sharpenedValues,
    width,
    height,
  );
  const threshold = getOtsuThreshold(sharpenedValues);
  const thresholdCanvas = createThresholdCanvas(
    sharpenedValues,
    width,
    height,
    threshold,
  );

  if (!intensive) {
    return [sharpenedCanvas, thresholdCanvas].filter(
      (canvas): canvas is HTMLCanvasElement => canvas !== null,
    );
  }

  const stronglySharpenedValues = sharpenValues(
    sharpenedValues,
    width,
    height,
    0.82,
  );
  const strongThreshold = getOtsuThreshold(stronglySharpenedValues);
  const adaptiveValues = createAdaptiveThresholdValues(
    stronglySharpenedValues,
    width,
    height,
    strongThreshold,
  );
  const invertedAdaptiveValues = new Uint8ClampedArray(adaptiveValues.length);
  for (let pixel = 0; pixel < adaptiveValues.length; pixel += 1) {
    invertedAdaptiveValues[pixel] = 255 - adaptiveValues[pixel];
  }

  return [
    sharpenedCanvas,
    createGrayscaleCanvas(stronglySharpenedValues, width, height),
    thresholdCanvas,
    createThresholdCanvas(
      stronglySharpenedValues,
      width,
      height,
      strongThreshold,
    ),
    createGrayscaleCanvas(adaptiveValues, width, height),
    createGrayscaleCanvas(invertedAdaptiveValues, width, height),
  ].filter((canvas): canvas is HTMLCanvasElement => canvas !== null);
}

export async function applyCameraOptimizations(video: HTMLVideoElement) {
  const stream = video.srcObject;
  if (!(stream instanceof MediaStream)) return;

  const track = stream.getVideoTracks()[0];
  if (!track) return;

  try {
    track.contentHint = "detail";
    const capabilities = track.getCapabilities() as CameraCapabilities;
    const advanced: CameraConstraintSet[] = [];

    if (capabilities.focusMode?.includes("continuous")) {
      advanced.push({ focusMode: "continuous" });
    }

    const maximumSharpness = capabilities.sharpness?.max;
    if (
      maximumSharpness !== undefined &&
      Number.isFinite(maximumSharpness)
    ) {
      advanced.push({ sharpness: maximumSharpness });
    }

    const maximumWidth = capabilities.width?.max;
    const maximumHeight = capabilities.height?.max;
    if (
      maximumWidth !== undefined &&
      maximumHeight !== undefined &&
      maximumWidth >= 1280 &&
      maximumHeight >= 720
    ) {
      advanced.push({
        width: Math.min(1920, maximumWidth),
        height: Math.min(1080, maximumHeight),
      });
    }

    if (advanced.length) {
      const currentConstraints = track.getConstraints();
      await track.applyConstraints({
        ...currentConstraints,
        advanced: [...(currentConstraints.advanced ?? []), ...advanced],
      });
    }
  } catch {
    // Keep scanning with the browser-selected camera settings.
  }
}

export function createEnhancedVideoFrames(video: HTMLVideoElement) {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return [];

  const source = makeCanvas(
    video,
    video.videoWidth,
    video.videoHeight,
    CAMERA_FRAME_MAX_DIMENSION,
    false,
  );
  return source ? createEnhancedCanvases(source) : [];
}

export async function createEnhancedImageFrames(imageUrl: string) {
  const image = new Image();
  image.decoding = "async";

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Could not read the image."));
    image.src = imageUrl;
  });

  const source = makeCanvas(
    image,
    image.naturalWidth,
    image.naturalHeight,
    IMAGE_FRAME_MAX_DIMENSION,
    true,
  );
  return source ? createEnhancedCanvases(source, true) : [];
}
