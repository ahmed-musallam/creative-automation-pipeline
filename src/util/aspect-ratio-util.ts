export const FireflyAspectRatios = {
  "1:1": { width: 1024, height: 1024 },
  "4:3": { width: 2304, height: 1792 },
  "3:4": { width: 1792, height: 2304 },
  "16:9": { width: 2688, height: 1536 },
  "7:4": { width: 1344, height: 768 },
  "9:7": { width: 1152, height: 896 },
  "7:9": { width: 896, height: 1152 },
};

export type FireflyAspectRatioKey = keyof typeof FireflyAspectRatios;

export const parseAspectRatio = (aspectRatio: string): [number, number] => {
  const [w, h] = aspectRatio.split(":").map(Number);
  if (!w || !h) {
    throw new Error(`Invalid aspect ratio format: ${aspectRatio}`);
  }
  return [w, h];
};

export const isValidAspectRatio = (aspectRatio: string): boolean => {
  try {
    const [w, h] = parseAspectRatio(aspectRatio);
    if (w <= 0 || h <= 0) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
};

export const getApproximatedAspectRatio = (aspectRatio: string): string => {
  // Parse the input aspect ratio string (e.g., "16:9")
  const [inputW, inputH] = aspectRatio.split(":").map(Number);
  if (!inputW || !inputH) {
    throw new Error(`Invalid aspect ratio format: ${aspectRatio}`);
  }
  const inputRatio = inputW / inputH;

  let closestKey = Object.keys(FireflyAspectRatios)[0];
  const [closestW, closestH] = parseAspectRatio(closestKey);
  let closestDiff = Math.abs(closestW / closestH - inputRatio);

  for (const key of Object.keys(FireflyAspectRatios)) {
    const [w, h] = parseAspectRatio(key);
    const ratio = w / h;
    const diff = Math.abs(ratio - inputRatio);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestKey = key;
    }
  }
  return closestKey;
};

export const getExpandedSizeForAspectRatio = (
  aspectRatio: string
): { width: number; height: number } => {
  const approximatedAspectRatio = getApproximatedAspectRatio(aspectRatio);
  const baseSize =
    FireflyAspectRatios[
      approximatedAspectRatio as keyof typeof FireflyAspectRatios
    ];
  // If the aspect ratio matches a known ratio, just return the base size
  if (approximatedAspectRatio === aspectRatio) {
    return { ...baseSize };
  }

  // Otherwise, adjust the base size to match the exact aspect ratio, keeping the area similar to the base size
  const baseArea = baseSize.width * baseSize.height;
  const [w, h] = parseAspectRatio(aspectRatio);
  if (!w || !h) {
    throw new Error(`Invalid aspect ratio format: ${aspectRatio}`);
  }
  const targetRatio = w / h;

  // Calculate new width and height such that width/height = targetRatio and area ≈ baseArea
  // width = sqrt(area * ratio)
  // height = sqrt(area / ratio)
  const newWidth = Math.round(Math.sqrt(baseArea * targetRatio));
  const newHeight = Math.round(Math.sqrt(baseArea / targetRatio));

  return { width: newWidth, height: newHeight };
};
