"use client";

import { useActionState } from "react";
import type { LineageConnectionActionState } from "@/actions/lineage-connections";

export function ExternalLineageRequestForm({
  requestAction,
}: {
  requestAction: (
    state: LineageConnectionActionState,
    formData: FormData
  ) => Promise<LineageConnectionActionState>;
}) {
  const [state, formAction, pending] = useActionState(requestAction, {});

  return (
    <section className="bg-card p-5 shadow-golden">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[2px] text-brand-orange">
          External Code
        </p>
        <h3 className="text-xl">Request an external parent link</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter a shared identity code from another owner. CatHub will create a
          pending request; the other owner must confirm before the lineage edge
          becomes part of the graph.
        </p>
      </div>

      <form action={formAction} className="space-y-3">
        <select
          name="parentRole"
          defaultValue="sire"
          className="w-full border border-border bg-background px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="sire">Sire / father</option>
          <option value="dam">Dam / mother</option>
        </select>

        <input
          name="identityCode"
          type="text"
          placeholder="CAT-XXXX-XXXX-XXXX"
          autoCapitalize="characters"
          className="w-full border border-border bg-background px-3 py-3 font-mono text-sm uppercase tracking-[1.5px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <textarea
          name="requestNote"
          rows={2}
          placeholder="Optional note for the other owner"
          className="w-full border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        {state.fieldErrors?.parentRole && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.parentRole[0]}
          </p>
        )}
        {state.fieldErrors?.identityCode && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.identityCode[0]}
          </p>
        )}
        {state.fieldErrors?.requestNote && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.requestNote[0]}
          </p>
        )}
        {state.success && (
          <p className="text-sm text-brand-orange">{state.success}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-primary text-primary-foreground text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Sending..." : "Send Request"}
        </button>
      </form>
    </section>
  );
}
