"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { updateProfile, type UserSettingsState } from "@/actions/user";

type ProfileSettingsFormProps = {
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
};

const initialState: UserSettingsState = {};

export function ProfileSettingsForm({
  displayName,
  bio,
  avatarUrl,
}: ProfileSettingsFormProps) {
  const [state, formAction, pending] = useActionState(
    updateProfile,
    initialState
  );
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  }

  const displayedAvatar = preview ?? avatarUrl;

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="space-y-6 bg-card p-6 shadow-golden"
    >
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

      {/* Avatar */}
      <div>
        <label className="block text-sm uppercase tracking-wider mb-3">
          Avatar
        </label>
        <div className="flex items-center gap-5">
          <div className="relative w-20 h-20 bg-sunshine-300/30 flex items-center justify-center text-3xl shrink-0 overflow-hidden">
            {displayedAvatar ? (
              <Image
                src={displayedAvatar}
                alt="Avatar"
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <span className="text-muted-foreground">👤</span>
            )}
          </div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-4 py-2 bg-secondary text-secondary-foreground text-sm uppercase tracking-wider hover:opacity-80 transition-opacity"
            >
              {displayedAvatar ? "Change avatar" : "Upload avatar"}
            </button>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WEBP or GIF. Max 5 MB.
            </p>
            <input
              ref={fileRef}
              type="file"
              name="avatar"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
        {state.fieldErrors?.avatar && (
          <p className="mt-2 text-sm text-destructive">
            {state.fieldErrors.avatar[0]}
          </p>
        )}
      </div>

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
