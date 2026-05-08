
/**
 * Utility to compress and resize images before uploading to Firestore 
 * to stay under the 1MB document limit.
 */
export const compressImage = async (data: string, maxWidth: number = 800, quality: number = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Ensure image has data URL prefix for loading
    const src = data.startsWith('data:') ? data : `data:image/jpeg;base64,${data}`;
    img.src = src;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate scale to fit within maxWidth
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Could not get canvas context'));
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to JPEG with compression
      const compressedData = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedData);
    };
    img.onerror = (err) => reject(err);
  });
};
