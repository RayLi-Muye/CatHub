"use client";

export function VideoPlayer({ src, className }: { src: string; className?: string }) {
  return (
    <video
      src={src}
      controls
      preload="metadata"
      playsInline
      className={`w-full max-h-96 bg-black ${className ?? ""}`}
    >
      Your browser does not support video playback.
    </video>
  );
}
