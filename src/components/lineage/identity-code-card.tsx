"use client";

import { useActionState } from "react";
import type { IdentityCodeActionState } from "@/actions/identity-code";

type IdentityCode = {
  code: string;
  visibility: "private" | "public";
  createdAtLabel: string;
};

export function IdentityCodeCard({
  identityCode,
  generateAction,
}: {
  identityCode?: IdentityCode | null;
  generateAction: (
    state: IdentityCodeActionState,
    formData: FormData
  ) => Promise<IdentityCodeActionState>;
}) {
  const [state, formAction, pending] = useActionState(generateAction, {});

  return (
    <section className="mb-8 border border-border bg-card p-5 shadow-golden">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-1 text-xs uppercase tracking-[2px] text-brand-orange">
            Global Identity
          </p>
          <h2 className="text-2xl">Share-only identity code</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            This code is only visible to the owner. Later it will be used for QR
            based external lineage requests with owner confirmation.
          </p>
        </div>

        {identityCode ? (
          <div className="bg-background px-5 py-4 text-right">
            <p className="font-mono text-xl tracking-[2px]">
              {identityCode.code}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
              {identityCode.visibility} - issued {identityCode.createdAtLabel}
            </p>
          </div>
        ) : (
          <form action={formAction}>
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-3 bg-primary text-primary-foreground text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Generating..." : "Generate Code"}
            </button>
          </form>
        )}
      </div>

      {state.error && (
        <p className="mt-3 text-sm text-destructive">{state.error}</p>
      )}
      {state.success && (
        <p className="mt-3 text-sm text-brand-orange">{state.success}</p>
      )}
    </section>
  );
}
