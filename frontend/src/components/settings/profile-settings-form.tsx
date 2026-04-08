"use client";

import { useActionState } from "react";
import { updateProfile, type UserSettingsState } from "@/actions/user";

type ProfileSettingsFormProps = {
  displayName?: string | null;
  bio?: string | null;
};

const initialState: UserSettingsState = {};

export function ProfileSettingsForm({
  displayName,
  bio,
}: ProfileSettingsFormProps) {
  const [state, formAction, pending] = useActionState(
    updateProfile,
    initialState
  );

  return (
    <form action={formAction} className="space-y-6 bg-card p-6 shadow-golden">
      <div>
        <p className="text-sm uppercase tracking-[2.52px] text-brand-orange mb-2">
          Public Profile
        </p>
        <h2 className="text-3xl mb-2">Profile settings</h2>
        <p className="text-muted-foreground">
          Update the public-facing details people see on your CatHub profile.
        </p>
      </div>

      {state.error && (
        <div className="p-4 bg-destructive/10 text-destructive text-sm">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="p-4 bg-sunshine-300/25 text-sm">{state.success}</div>
      )}

      <div>
        <label
          htmlFor="displayName"
          className="block text-sm uppercase tracking-wider mb-2"
        >
          Display Name
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          maxLength={100}
          defaultValue={displayName ?? ""}
          placeholder="How should people see your name?"
          className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {state.fieldErrors?.displayName && (
          <p className="mt-1 text-sm text-destructive">
            {state.fieldErrors.displayName[0]}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="bio"
          className="block text-sm uppercase tracking-wider mb-2"
        >
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={5}
          maxLength={500}
          defaultValue={bio ?? ""}
          placeholder="Tell other cat parents a bit about yourself."
          className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
        />
        {state.fieldErrors?.bio && (
          <p className="mt-1 text-sm text-destructive">
            {state.fieldErrors.bio[0]}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="px-6 py-3 bg-primary text-primary-foreground text-sm uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
}
