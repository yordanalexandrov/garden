/**
 * Client-side image compression shared by photo flows (problem photos,
 * AI plant ingestion). Downscales to a max dimension and re-encodes lossy
 * formats; falls back to the original file whenever compression would not
 * help or the image cannot be decoded.
 */
export function compressImage(file: File): Promise<File> {
  const MAX_DIMENSION = 1920;
  const QUALITY = 0.85;
  const isPng = file.type === 'image/png';

  return new Promise<File>((resolve) => {
    let url: string;
    try {
      url = URL.createObjectURL(file);
    } catch {
      resolve(file);
      return;
    }

    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      const needsResize = img.width > MAX_DIMENSION || img.height > MAX_DIMENSION;

      // PNG is lossless — only process if a resize is needed.
      if (isPng && !needsResize) {
        resolve(file);
        return;
      }

      const ratio = needsResize
        ? Math.min(MAX_DIMENSION / img.width, MAX_DIMENSION / img.height)
        : 1;

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const quality = isPng ? undefined : QUALITY;
      canvas.toBlob(
        (blob) => {
          // If encoding produced a larger file (already well-compressed), keep original.
          if (blob === null || blob.size >= file.size) {
            resolve(file);
            return;
          }
          resolve(new File([blob], file.name, { type: file.type }));
        },
        file.type,
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

/** Reads a file as a base64 data URL (e.g. for JSON transport to the API). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
