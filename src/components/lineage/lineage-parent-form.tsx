"use client";

import { useActionState } from "react";
import type { LineageActionState } from "@/actions/lineage";
import type { LineageParentRole } from "@/lib/validators/lineage";

type CandidateCat = {
  id: string;
  name: string;
  breed: string | null;
  sex: "male" | "female" | "unknown" | null;
};

type CurrentParent = CandidateCat & {
  edgeId: string;
};

const roleCopy: Record<LineageParentRole, { title: string; hint: string }> = {
  sire: {
    title: "Sire",
    hint: "Choose the father from cats you own.",
  },
  dam: {
    title: "Dam",
    hint: "Choose the mother from cats you own.",
  },
  unknown: {
    title: "Parent",
    hint: "Choose a parent from cats you own.",
  },
};

export function LineageParentForm({
  role,
  candidates,
  currentParent,
  setAction,
  removeAction,
}: {
  role: LineageParentRole;
  candidates: CandidateCat[];
  currentParent?: CurrentParent;
  setAction: (
    state: LineageActionState,
    formData: FormData
  ) => Promise<LineageActionState>;
  removeAction?: (formData: FormData) => Promise<void>;
}) {
  const [state, formAction, pending] = useActionState(setAction, {});
  const copy = roleCopy[role];

  return (
    <section className="bg-card p-5 shadow-golden">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[2px] text-brand-orange">
          {copy.title}
        </p>
        <p className="text-sm text-muted-foreground">{copy.hint}</p>
      </div>

      {currentParent && (
        <div className="mb-4 border border-border bg-background p-3">
          <p className="text-sm">
            Current {copy.title.toLowerCase()}:{" "}
            <span className="text-foreground">{currentParent.name}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {[currentParent.breed, currentParent.sex].filter(Boolean).join(" · ")}
          </p>
          {removeAction && (
            <form action={removeAction} className="mt-3">
              <button
                type="submit"
                className="text-xs uppercase tracking-wider text-destructive hover:underline"
              >
                Remove link
              </button>
            </form>
          )}
        </div>
      )}

      <form action={formAction} className="space-y-3">
        <select
          name="parentCatId"
          defaultValue={currentParent?.id ?? ""}
          className="w-full border border-border bg-background px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={candidates.length === 0}
        >
          <option value="">Select a cat</option>
          {candidates.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
              {cat.breed ? ` · ${cat.breed}` : ""}
              {cat.sex ? ` · ${cat.sex}` : ""}
            </option>
          ))}
        </select>

        <textarea
          name="notes"
          rows={2}
          placeholder="Optional note for this lineage link"
          className="w-full border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        {state.fieldErrors?.parentCatId && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.parentCatId[0]}
          </p>
        )}
        {state.success && (
          <p className="text-sm text-brand-orange">{state.success}</p>
        )}

        <button
          type="submit"
          disabled={pending || candidates.length === 0}
          className="px-4 py-2 bg-primary text-primary-foreground text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving..." : `Save ${copy.title}`}
        </button>
      </form>
    </section>
  );
}
