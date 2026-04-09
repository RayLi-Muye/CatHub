"use client";

import { useActionState, useRef, useState } from "react";
import {
  createTimelinePost,
  type TimelineActionState,
} from "@/actions/timeline";

const initialState: TimelineActionState = {};

export function PostForm({ catId }: { catId: string }) {
  const boundAction = createTimelinePost.bind(null, catId);
  const [state, formAction, pending] = useActionState(
    boundAction,
    initialState
  );
  const [hasImage, setHasImage] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Reset form on success
  if (state.success && formRef.current) {
    formRef.current.reset();
    if (hasImage) setHasImage(false);
  }

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

      <textarea
        name="content"
        rows={3}
        maxLength={1000}
        placeholder="What's your cat up to?"
        required
        className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y mb-3"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border transition-colors"
          >
            {hasImage ? "Change image" : "Add image"}
          </button>
          {hasImage && (
            <span className="text-xs text-muted-foreground">
              Image attached
            </span>
          )}
          <input
            ref={fileRef}
            type="file"
            name="image"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => setHasImage(!!e.target.files?.[0])}
            className="hidden"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2 bg-primary text-primary-foreground text-sm uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {pending ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}
