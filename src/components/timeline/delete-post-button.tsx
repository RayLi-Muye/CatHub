"use client";

import { useState } from "react";
import { deleteTimelinePost } from "@/actions/timeline";

export function DeletePostButton({ postId }: { postId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await deleteTimelinePost(postId);
  }

  if (confirming) {
    return (
      <div className="flex gap-2 text-xs">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-destructive hover:underline disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-muted-foreground hover:underline"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-muted-foreground hover:text-destructive transition-colors"
    >
      Delete
    </button>
  );
}
