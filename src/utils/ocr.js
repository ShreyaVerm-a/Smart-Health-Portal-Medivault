import Tesseract from 'tesseract.js';

const MAX_IMAGE_DIMENSION = 2048;

/**
 * Resize image if needed to fit within max dimensions
 */
function resizeImageIfNeeded(canvas, ctx, image) {
  let width = image.naturalWidth || image.width;
  let height = image.naturalHeight || image.height;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
      width = MAX_IMAGE_DIMENSION;
    } else {
      width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
      height = MAX_IMAGE_DIMENSION;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    return true;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0);
  return false;
}

/**
 * Load an image from a file/blob
 */
export const loadImage = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Extract text from a canvas using Tesseract
 */
async function extractTextFromCanvas(canvas, onProgress, progressBase = 0, progressRange = 100) {
  const imageData = canvas.toDataURL('image/png');
  
  const result = await Tesseract.recognize(imageData, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text' && m.progress) {
        const progress = progressBase + (m.progress * progressRange);
        onProgress?.({ 
          status: 'processing', 
          progress: Math.min(progress, 95), 
          message: `Recognizing text... ${Math.round(m.progress * 100)}%` 
        });
      }
    },
  });
  
  return result.data.text.trim();
}

/**
 * Extract text from image file
 */
export const extractTextFromImage = async (imageFile, onProgress) => {
  try {
    console.log('Starting image OCR process...');
    
    onProgress?.({ status: 'loading', progress: 10, message: 'Loading image...' });

    // Convert file to image element
    const imageElement = await loadImage(imageFile);
    
    // Create canvas for image processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');
    
    // Resize if needed and draw to canvas
    const wasResized = resizeImageIfNeeded(canvas, ctx, imageElement);
    console.log(`Image ${wasResized ? 'was' : 'was not'} resized. Final dimensions: ${canvas.width}x${canvas.height}`);
    
    onProgress?.({ status: 'processing', progress: 20, message: 'Extracting text...' });

    // Run OCR with Tesseract
    const text = await extractTextFromCanvas(canvas, onProgress, 20, 75);
    
    onProgress?.({ status: 'complete', progress: 100, message: 'Text extraction complete!' });

    if (!text) {
      throw new Error('No text could be extracted from the image. The image may be empty or contain only graphics without recognizable text.');
    }

    return {
      success: true,
      text: text,
    };
  } catch (error) {
    console.error('Error extracting text:', error);
    onProgress?.({ status: 'error', progress: 0, message: 'Failed to extract text' });
    return {
      success: false,
      error: error.message || 'Failed to extract text from image',
    };
  }
};

/**
 * Main function - currently supports images only
 * PDF support can be added later if needed
 */
export const extractText = async (file, onProgress) => {
  const fileType = file.type || '';
  const fileName = file.name || '';
  
  // Check if it's a PDF - currently not supported
  if (fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
    return {
      success: false,
      error: 'PDF OCR is not currently supported. Please upload an image file (JPG, PNG) instead.',
    };
  }
  
  return extractTextFromImage(file, onProgress);
};
