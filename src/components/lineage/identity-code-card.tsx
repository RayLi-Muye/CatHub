"use client";

import QRCode from "qrcode";
import { useActionState, useEffect, useMemo, useState } from "react";
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
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const connectUrl = useMemo(() => {
    if (!identityCode) return null;
    return `cathub://connect?code=${encodeURIComponent(identityCode.code)}`;
  }, [identityCode]);

  useEffect(() => {
    let isMounted = true;

    if (!connectUrl) return;

    QRCode.toDataURL(connectUrl, {
      errorCorrectionLevel: "M",
      margin: 2,
      scale: 6,
      color: {
        dark: "#1f2937",
        light: "#ffffff",
      },
    })
      .then((dataUrl) => {
        if (isMounted) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (isMounted) setQrDataUrl(null);
      });

    return () => {
      isMounted = false;
    };
  }, [connectUrl]);

  return (
    <section className="mb-8 border border-border bg-card p-5 shadow-golden">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-1 text-xs uppercase tracking-[2px] text-brand-orange">
            Global Identity
          </p>
          <h2 className="text-2xl">Share-only identity code</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            This code is only visible to the owner. Share it as text or QR so
            another owner can request an external lineage link.
          </p>
        </div>

        {identityCode ? (
          <div className="flex flex-col items-start gap-4 bg-background px-5 py-4 md:flex-row md:items-center">
            <div className="flex h-36 w-36 items-center justify-center border border-border bg-white p-2">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt={`QR code for ${identityCode.code}`}
                  className="h-full w-full"
                />
              ) : (
                <span className="text-xs text-muted-foreground">
                  Generating QR...
                </span>
              )}
            </div>
            <div className="text-left md:text-right">
              <p className="font-mono text-xl tracking-[2px]">
                {identityCode.code}
              </p>
              <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                {identityCode.visibility} - issued {identityCode.createdAtLabel}
              </p>
              <p className="mt-2 max-w-72 text-xs text-muted-foreground">
                QR opens the mobile connect flow and pre-fills this code.
              </p>
            </div>
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
