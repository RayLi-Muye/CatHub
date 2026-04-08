"use client";

import { useActionState } from "react";
import type { HealthActionState } from "@/actions/health";

const recordTypes = [
  { value: "checkup", label: "Checkup" },
  { value: "vaccination", label: "Vaccination" },
  { value: "surgery", label: "Surgery" },
  { value: "illness", label: "Illness" },
  { value: "medication", label: "Medication" },
  { value: "other", label: "Other" },
];

export function HealthRecordForm({
  action,
}: {
  action: (
    state: HealthActionState,
    formData: FormData
  ) => Promise<HealthActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      {state.error && (
        <div className="p-4 bg-destructive/10 text-destructive text-sm">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="type"
            className="block text-sm uppercase tracking-wider mb-2"
          >
            Type *
          </label>
          <select
            id="type"
            name="type"
            required
            className="w-full px-4 py-3 bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {recordTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="date"
            className="block text-sm uppercase tracking-wider mb-2"
          >
            Date *
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={new Date().toISOString().split("T")[0]}
            className="w-full px-4 py-3 bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {state.fieldErrors?.date && (
            <p className="mt-1 text-sm text-destructive">
              {state.fieldErrors.date[0]}
            </p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="title"
          className="block text-sm uppercase tracking-wider mb-2"
        >
          Title *
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="e.g. Annual vaccination"
          className="w-full px-4 py-3 bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {state.fieldErrors?.title && (
          <p className="mt-1 text-sm text-destructive">
            {state.fieldErrors.title[0]}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm uppercase tracking-wider mb-2"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Details about the visit or treatment..."
          className="w-full px-4 py-3 bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="vetName"
            className="block text-sm uppercase tracking-wider mb-2"
          >
            Vet Name
          </label>
          <input
            id="vetName"
            name="vetName"
            type="text"
            className="w-full px-4 py-3 bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label
            htmlFor="vetClinic"
            className="block text-sm uppercase tracking-wider mb-2"
          >
            Vet Clinic
          </label>
          <input
            id="vetClinic"
            name="vetClinic"
            type="text"
            className="w-full px-4 py-3 bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="px-6 py-3 bg-primary text-primary-foreground text-sm uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {pending ? "Saving..." : "Add Record"}
      </button>
    </form>
  );
}
