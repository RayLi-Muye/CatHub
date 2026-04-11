const MAX_DURATION_SECONDS = 30;
const MAX_WIDTH = 1280;
const MAX_HEIGHT = 720;
const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

export type VideoCheckResult = {
  valid: boolean;
  error?: string;
  duration?: number;
  width?: number;
  height?: number;
};

/**
 * Check video file specs client-side before upload.
 * Limits: 30s duration, 720p resolution, 20MB size.
 */
export function checkVideoSpecs(file: File): Promise<VideoCheckResult> {
  // Check size first (synchronous)
  if (file.size > MAX_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return Promise.resolve({
      valid: false,
      error: `Video is ${sizeMB}MB, max allowed is 20MB`,
    });
  }

  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);

      const { duration, videoWidth, videoHeight } = video;

      if (duration > MAX_DURATION_SECONDS) {
        resolve({
          valid: false,
          error: `Video is ${Math.ceil(duration)}s, max allowed is ${MAX_DURATION_SECONDS}s`,
          duration,
          width: videoWidth,
          height: videoHeight,
        });
        return;
      }

      if (videoWidth > MAX_WIDTH || videoHeight > MAX_HEIGHT) {
        resolve({
          valid: false,
          error: `Video resolution ${videoWidth}×${videoHeight} exceeds max 1280×720`,
          duration,
          width: videoWidth,
          height: videoHeight,
        });
        return;
      }

      resolve({
        valid: true,
        duration,
        width: videoWidth,
        height: videoHeight,
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve({ valid: false, error: "Could not read video metadata" });
    };

    video.src = URL.createObjectURL(file);
  });
}

export const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export const VIDEO_LIMITS = {
  maxDuration: MAX_DURATION_SECONDS,
  maxWidth: MAX_WIDTH,
  maxHeight: MAX_HEIGHT,
  maxSize: MAX_SIZE_BYTES,
};
