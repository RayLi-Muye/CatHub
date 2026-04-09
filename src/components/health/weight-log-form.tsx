"use client";

import { useActionState } from "react";
import type { HealthActionState } from "@/actions/health";

export function WeightLogForm({
  action,
}: {
  action: (
    state: HealthActionState,
    formData: FormData
  ) => Promise<HealthActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      {state.error && (
        <div className="w-full p-3 bg-destructive/10 text-destructive text-sm">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="w-full p-3 bg-sunshine-300/20 text-foreground text-sm">
          Weight recorded!
        </div>
      )}

      <div>
        <label
          htmlFor="weightKg"
          className="block text-xs uppercase tracking-wider mb-1"
        >
          Weight (kg)
        </label>
        <input
          id="weightKg"
          name="weightKg"
          type="number"
          step="0.01"
          min="0.1"
          max="50"
          required
          className="w-24 px-3 py-2 bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {state.fieldErrors?.weightKg && (
          <p className="mt-1 text-xs text-destructive">
            {state.fieldErrors.weightKg[0]}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="recordedAt"
          className="block text-xs uppercase tracking-wider mb-1"
        >
          Date
        </label>
        <input
          id="recordedAt"
          name="recordedAt"
          type="date"
          required
          defaultValue={new Date().toISOString().split("T")[0]}
          className="w-36 px-3 py-2 bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="flex-1 min-w-[120px]">
        <label
          htmlFor="notes"
          className="block text-xs uppercase tracking-wider mb-1"
        >
          Notes
        </label>
        <input
          id="notes"
          name="notes"
          type="text"
          placeholder="Optional"
          className="w-full px-3 py-2 bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 bg-primary text-primary-foreground text-xs uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {pending ? "..." : "Log"}
      </button>
    </form>
  );
}
