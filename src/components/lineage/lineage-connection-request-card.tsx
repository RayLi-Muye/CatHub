"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { LineageConnectionActionState } from "@/actions/lineage-connections";
import type { LineageConnectionRequestSummary } from "@/lib/lineage/connection-queries";

type Action = (
  state: LineageConnectionActionState,
  formData: FormData
) => Promise<LineageConnectionActionState>;

const roleLabels: Record<string, string> = {
  sire: "sire",
  dam: "dam",
  unknown: "parent",
};

function CatLink({
  cat,
}: {
  cat: LineageConnectionRequestSummary["child"];
}) {
  return (
    <Link
      href={`/${cat.username}/${cat.slug}/lineage`}
      className="text-foreground hover:text-brand-orange"
    >
      {cat.name}
      <span className="text-muted-foreground"> @{cat.username}/{cat.slug}</span>
    </Link>
  );
}

function RequestSummary({
  request,
  direction,
}: {
  request: LineageConnectionRequestSummary;
  direction: "incoming" | "outgoing";
}) {
  const role = roleLabels[request.parentRole] ?? request.parentRole;

  return (
    <div>
      <p className="text-xs uppercase tracking-[2px] text-brand-orange">
        {direction === "incoming" ? "Incoming lineage request" : "Sent request"}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {direction === "incoming"
          ? `${request.requester.displayName ?? request.requester.username} wants to link `
          : "Waiting for confirmation to link "}
        <CatLink cat={request.parent} /> as {role} of{" "}
        <CatLink cat={request.child} />.
      </p>
      <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
        Requested {request.createdAt.toISOString().slice(0, 10)}
      </p>
      {request.requestNote && (
        <p className="mt-3 border-l border-border pl-3 text-sm text-muted-foreground">
          {request.requestNote}
        </p>
      )}
    </div>
  );
}

function IncomingActions({
  acceptAction,
  declineAction,
}: {
  acceptAction: Action;
  declineAction: Action;
}) {
  const [acceptState, acceptFormAction, acceptPending] = useActionState(
    acceptAction,
    {}
  );
  const [declineState, declineFormAction, declinePending] = useActionState(
    declineAction,
    {}
  );
  const pending = acceptPending || declinePending;

  return (
    <div className="flex flex-col gap-3 md:items-end">
      <div className="flex gap-2">
        <form action={acceptFormAction}>
          <button
            type="submit"
            disabled={pending}
            className="px-3 py-2 bg-primary text-primary-foreground text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
          >
            {acceptPending ? "Accepting..." : "Accept"}
          </button>
        </form>
        <form action={declineFormAction}>
          <button
            type="submit"
            disabled={pending}
            className="px-3 py-2 border border-border text-xs uppercase tracking-wider hover:bg-background disabled:opacity-50"
          >
            {declinePending ? "Declining..." : "Decline"}
          </button>
        </form>
      </div>
      {(acceptState.error || declineState.error) && (
        <p className="max-w-xs text-right text-sm text-destructive">
          {acceptState.error ?? declineState.error}
        </p>
      )}
      {(acceptState.success || declineState.success) && (
        <p className="max-w-xs text-right text-sm text-brand-orange">
          {acceptState.success ?? declineState.success}
        </p>
      )}
    </div>
  );
}

function OutgoingActions({ cancelAction }: { cancelAction: Action }) {
  const [state, formAction, pending] = useActionState(cancelAction, {});

  return (
    <div className="flex flex-col gap-2 md:items-end">
      <form action={formAction}>
        <button
          type="submit"
          disabled={pending}
          className="px-3 py-2 border border-border text-xs uppercase tracking-wider hover:bg-background disabled:opacity-50"
        >
          {pending ? "Canceling..." : "Cancel"}
        </button>
      </form>
      {state.error && (
        <p className="max-w-xs text-right text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="max-w-xs text-right text-sm text-brand-orange">
          {state.success}
        </p>
      )}
    </div>
  );
}

export function IncomingLineageConnectionRequestCard({
  request,
  acceptAction,
  declineAction,
}: {
  request: LineageConnectionRequestSummary;
  acceptAction: Action;
  declineAction: Action;
}) {
  return (
    <article className="flex flex-col gap-4 border border-border bg-card p-4 md:flex-row md:items-start md:justify-between">
      <RequestSummary request={request} direction="incoming" />
      <IncomingActions
        acceptAction={acceptAction}
        declineAction={declineAction}
      />
    </article>
  );
}

export function OutgoingLineageConnectionRequestCard({
  request,
  cancelAction,
}: {
  request: LineageConnectionRequestSummary;
  cancelAction: Action;
}) {
  return (
    <article className="flex flex-col gap-4 border border-border bg-card p-4 md:flex-row md:items-start md:justify-between">
      <RequestSummary request={request} direction="outgoing" />
      <OutgoingActions cancelAction={cancelAction} />
    </article>
  );
}
