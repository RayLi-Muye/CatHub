"use client";

import { useActionState } from "react";
import {
  updateAccountCredentials,
  type UserSettingsState,
} from "@/actions/user";

type CredentialsSettingsFormProps = {
  username: string;
  email: string;
};

const initialState: UserSettingsState = {};

export function CredentialsSettingsForm({
  username,
  email,
}: CredentialsSettingsFormProps) {
  const [state, formAction, pending] = useActionState(
    updateAccountCredentials,
    initialState
  );

  return (
    <form action={formAction} className="space-y-6 bg-card p-6 shadow-golden">
      <div>
        <p className="text-sm uppercase tracking-[2.52px] text-brand-orange mb-2">
          Login & Security
        </p>
        <h2 className="text-3xl mb-2">Account credentials</h2>
        <p className="text-muted-foreground">
          Change your username, login email, or password. Current password is
          required for any credential change.
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

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="username"
            className="block text-sm uppercase tracking-wider mb-2"
          >
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            defaultValue={username}
            className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {state.fieldErrors?.username && (
            <p className="mt-1 text-sm text-destructive">
              {state.fieldErrors.username[0]}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm uppercase tracking-wider mb-2"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={email}
            className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {state.fieldErrors?.email && (
            <p className="mt-1 text-sm text-destructive">
              {state.fieldErrors.email[0]}
            </p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="currentPassword"
          className="block text-sm uppercase tracking-wider mb-2"
        >
          Current Password
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {state.fieldErrors?.currentPassword && (
          <p className="mt-1 text-sm text-destructive">
            {state.fieldErrors.currentPassword[0]}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="newPassword"
            className="block text-sm uppercase tracking-wider mb-2"
          >
            New Password
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {state.fieldErrors?.newPassword && (
            <p className="mt-1 text-sm text-destructive">
              {state.fieldErrors.newPassword[0]}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm uppercase tracking-wider mb-2"
          >
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {state.fieldErrors?.confirmPassword && (
            <p className="mt-1 text-sm text-destructive">
              {state.fieldErrors.confirmPassword[0]}
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="px-6 py-3 bg-primary text-primary-foreground text-sm uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save Credentials"}
      </button>
    </form>
  );
}
