import imageCompression from "browser-image-compression";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/webp" as const,
};

/**
 * Compress an image file client-side before upload.
 * Converts to WebP, max 1920px, target ≤1MB.
 * Returns the original file if compression fails.
 */
export async function compressImage(file: File): Promise<File> {
  // Skip if already small enough and is webp
  if (file.size <= 500 * 1024 && file.type === "image/webp") {
    return file;
  }

  try {
    const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
    // Ensure the result is a File (not Blob) with proper name
    const name = file.name.replace(/\.[^.]+$/, ".webp");
    return new File([compressed], name, { type: "image/webp" });
  } catch {
    // Fallback to original if compression fails
    return file;
  }
}
