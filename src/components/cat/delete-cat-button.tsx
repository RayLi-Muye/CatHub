"use client";

import { useState } from "react";

export function DeleteCatButton({
  catId,
  catName,
  deleteCat,
}: {
  catId: string;
  catName: string;
  deleteCat: (catId: string) => Promise<{ error?: string }>;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="px-4 py-2 border border-destructive text-destructive text-sm uppercase tracking-wider hover:bg-destructive hover:text-white transition-colors"
      >
        Delete {catName}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">Are you sure?</span>
      <button
        onClick={async () => {
          await deleteCat(catId);
        }}
        className="px-4 py-2 bg-destructive text-white text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
      >
        Yes, delete
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="px-4 py-2 bg-secondary text-secondary-foreground text-sm uppercase tracking-wider"
      >
        Cancel
      </button>
    </div>
  );
}
