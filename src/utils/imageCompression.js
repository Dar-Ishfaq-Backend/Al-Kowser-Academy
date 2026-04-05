function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to compress image'));
        return;
      }
      resolve(blob);
    }, type, quality);
  });
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read the selected image'));
    };

    image.src = objectUrl;
  });
}

function sanitizeFileName(fileName) {
  return fileName.replace(/\.[^.]+$/, '').replace(/[^a-z0-9-_]+/gi, '-').replace(/-+/g, '-');
}

export async function compressImageFile(file, options = {}) {
  if (!file?.type?.startsWith('image/')) {
    throw new Error('Please upload an image file');
  }

  const {
    minSizeKB = 100,
    maxSizeKB = 180,
    targetSizeKB = 140,
    maxDimension = 1600,
  } = options;

  const image = await loadImage(file);
  let width = image.width;
  let height = image.height;

  if (width > height && width > maxDimension) {
    height = Math.round((height * maxDimension) / width);
    width = maxDimension;
  } else if (height >= width && height > maxDimension) {
    width = Math.round((width * maxDimension) / height);
    height = maxDimension;
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Image compression is not supported in this browser');
  }

  let bestBlob = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    let low = 0.35;
    let high = 0.95;

    for (let i = 0; i < 8; i += 1) {
      const quality = (low + high) / 2;
      const blob = await canvasToBlob(canvas, 'image/jpeg', quality);
      const sizeKB = blob.size / 1024;
      const distance = Math.abs(sizeKB - targetSizeKB);

      if (distance < bestDistance) {
        bestBlob = blob;
        bestDistance = distance;
      }

      if (sizeKB > maxSizeKB) {
        high = quality;
      } else {
        low = quality;
      }

      if (sizeKB >= minSizeKB && sizeKB <= maxSizeKB) {
        bestBlob = blob;
        bestDistance = 0;
        break;
      }
    }

    if (bestBlob && (bestBlob.size / 1024) <= maxSizeKB) {
      break;
    }

    width *= 0.88;
    height *= 0.88;
  }

  const finalBlob = bestBlob || await canvasToBlob(canvas, 'image/jpeg', 0.82);
  const baseName = sanitizeFileName(file.name || 'support-screenshot') || 'support-screenshot';

  return new File([finalBlob], `${baseName}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}

export function formatFileSize(sizeBytes) {
  if (!Number.isFinite(sizeBytes)) return '';
  return `${Math.round(sizeBytes / 1024)} KB`;
}
