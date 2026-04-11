"use client";

import { useActionState, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import {
  createTimelinePost,
  type TimelineActionState,
} from "@/actions/timeline";
import { compressImage } from "@/lib/media/compress";
import {
  checkVideoSpecs,
  ALLOWED_VIDEO_TYPES,
} from "@/lib/media/video-check";

const initialState: TimelineActionState = {};

export function PostForm({ catId }: { catId: string }) {
  const boundAction = createTimelinePost.bind(null, catId);
  const [state, formAction, pending] = useActionState(
    boundAction,
    initialState
  );
  const [mediaType, setMediaType] = useState<"none" | "image" | "video">(
    "none"
  );
  const [videoError, setVideoError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState("");
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Reset form on success
  if (state.success && formRef.current) {
    formRef.current.reset();
    setMediaType("none");
    setVideoUrl("");
    setVideoError("");
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setMediaType("none");
      return;
    }
    // Compress the image before attaching
    const compressed = await compressImage(file);
    // Replace the file input with compressed version
    const dt = new DataTransfer();
    dt.items.add(compressed);
    e.target.files = dt.files;
    setMediaType("image");
    // Clear video state
    setVideoUrl("");
    setVideoError("");
    if (videoRef.current) videoRef.current.value = "";
  }

  async function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setMediaType("none");
      return;
    }

    setVideoError("");

    // Check file type
    if (!ALLOWED_VIDEO_TYPES.has(file.type)) {
      setVideoError("Video must be MP4, WebM, or MOV");
      e.target.value = "";
      return;
    }

    // Check specs
    const check = await checkVideoSpecs(file);
    if (!check.valid) {
      setVideoError(check.error!);
      e.target.value = "";
      return;
    }

    // Client-side upload to Vercel Blob
    setUploading(true);
    setUploadProgress(0);
    try {
      const ext = file.name.split(".").pop() || "mp4";
      const blob = await upload(`timeline/${catId}-${Date.now()}.${ext}`, file, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
      });
      setVideoUrl(blob.url);
      setMediaType("video");
      // Clear image state
      if (imageRef.current) imageRef.current.value = "";
    } catch (err) {
      setVideoError(
        err instanceof Error ? err.message : "Video upload failed"
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  const isBusy = pending || uploading;

  return (
    <form
      ref={formRef}
      action={formAction}
      encType="multipart/form-data"
      className="bg-card p-5 shadow-golden mb-6"
    >
      {state.error && (
        <div className="p-3 mb-3 bg-destructive/10 text-destructive text-sm">
          {state.error}
        </div>
      )}
      {videoError && (
        <div className="p-3 mb-3 bg-destructive/10 text-destructive text-sm">
          {videoError}
        </div>
      )}

      {/* Hidden field for video URL from client upload */}
      <input type="hidden" name="videoUrl" value={videoUrl} />

      <textarea
        name="content"
        rows={3}
        maxLength={1000}
        placeholder="What's your cat up to?"
        required
        className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y mb-3"
      />

      {/* Health Alert Toggle */}
      <label className="flex items-center gap-2 mb-3 cursor-pointer">
        <input
          type="checkbox"
          name="isHealthAlert"
          className="w-4 h-4 accent-red-500"
        />
        <span className="text-xs text-muted-foreground">
          🚨 Health Alert
        </span>
      </label>

      {/* Upload progress */}
      {uploading && (
        <div className="mb-3">
          <div className="h-1.5 bg-secondary overflow-hidden">
            <div
              className="h-full bg-brand-orange transition-all"
              style={{ width: `${uploadProgress || 50}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Uploading video...
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => imageRef.current?.click()}
            className={`px-3 py-2 text-sm border border-border transition-colors ${
              mediaType === "image"
                ? "text-brand-orange border-brand-orange"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {mediaType === "image" ? "📷 Image ✓" : "📷 Image"}
          </button>
          <button
            type="button"
            onClick={() => videoRef.current?.click()}
            disabled={uploading}
            className={`px-3 py-2 text-sm border border-border transition-colors disabled:opacity-50 ${
              mediaType === "video"
                ? "text-brand-orange border-brand-orange"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {mediaType === "video" ? "🎬 Video ✓" : "🎬 Video"}
          </button>

          <input
            ref={imageRef}
            type="file"
            name="image"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleImageChange}
            className="hidden"
          />
          <input
            ref={videoRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleVideoChange}
            className="hidden"
          />
        </div>

        <button
          type="submit"
          disabled={isBusy}
          className="px-5 py-2 bg-primary text-primary-foreground text-sm uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {pending ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}
