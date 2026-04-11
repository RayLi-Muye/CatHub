"use client";

import Image from "next/image";
import { useActionState } from "react";
import type { CatActionState } from "@/actions/cat";
import { compressImage } from "@/lib/media/compress";

type CatData = {
  name?: string;
  breed?: string | null;
  sex?: string | null;
  birthdate?: Date | null;
  description?: string | null;
  avatarUrl?: string | null;
  colorMarkings?: string | null;
  microchipId?: string | null;
  isNeutered?: boolean | null;
  isPublic?: boolean | null;
};

export function CatForm({
  action,
  initialData,
  submitLabel = "Create Cat",
}: {
  action: (state: CatActionState, formData: FormData) => Promise<CatActionState>;
  initialData?: CatData;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="space-y-6 max-w-2xl"
    >
      {state.error && (
        <div className="p-4 bg-destructive/10 text-destructive text-sm">
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="avatar"
          className="block text-sm uppercase tracking-wider mb-2"
        >
          Avatar
        </label>
        <input
          id="avatar"
          name="avatar"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const compressed = await compressImage(file);
            const dt = new DataTransfer();
            dt.items.add(compressed);
            e.target.files = dt.files;
          }}
          className="w-full px-4 py-3 bg-card border border-border text-foreground file:mr-4 file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:text-primary-foreground"
        />
        <p className="mt-2 text-sm text-muted-foreground">
          PNG, JPG, WEBP, or GIF. Auto-compressed before upload.
        </p>
        {state.fieldErrors?.avatar && (
          <p className="mt-1 text-sm text-destructive">
            {state.fieldErrors.avatar[0]}
          </p>
        )}
        {initialData?.avatarUrl && (
          <div className="mt-4 flex items-center gap-4 bg-card p-4">
            <div className="relative w-20 h-20 overflow-hidden bg-sunshine-300/30 shrink-0">
              <Image
                src={initialData.avatarUrl}
                alt={initialData.name ?? "Cat avatar"}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Upload a new image to replace the current avatar.
            </p>
          </div>
        )}
      </div>

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm uppercase tracking-wider mb-2">
          Name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={initialData?.name}
          className="w-full px-4 py-3 bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {state.fieldErrors?.name && (
          <p className="mt-1 text-sm text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      {/* Breed & Sex */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="breed" className="block text-sm uppercase tracking-wider mb-2">
            Breed
          </label>
          <input
            id="breed"
            name="breed"
            type="text"
            defaultValue={initialData?.breed ?? ""}
            placeholder="e.g. British Shorthair"
            className="w-full px-4 py-3 bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="sex" className="block text-sm uppercase tracking-wider mb-2">
            Sex
          </label>
          <select
            id="sex"
            name="sex"
            defaultValue={initialData?.sex ?? "unknown"}
            className="w-full px-4 py-3 bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="unknown">Unknown</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </div>

      {/* Birthdate & Color */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="birthdate" className="block text-sm uppercase tracking-wider mb-2">
            Birthdate
          </label>
          <input
            id="birthdate"
            name="birthdate"
            type="date"
            defaultValue={
              initialData?.birthdate
                ? initialData.birthdate.toISOString().split("T")[0]
                : ""
            }
            className="w-full px-4 py-3 bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="colorMarkings" className="block text-sm uppercase tracking-wider mb-2">
            Color / Markings
          </label>
          <input
            id="colorMarkings"
            name="colorMarkings"
            type="text"
            defaultValue={initialData?.colorMarkings ?? ""}
            placeholder="e.g. Orange tabby"
            className="w-full px-4 py-3 bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Microchip */}
      <div>
        <label htmlFor="microchipId" className="block text-sm uppercase tracking-wider mb-2">
          Microchip ID
        </label>
        <input
          id="microchipId"
          name="microchipId"
          type="text"
          defaultValue={initialData?.microchipId ?? ""}
          className="w-full px-4 py-3 bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm uppercase tracking-wider mb-2">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={initialData?.description ?? ""}
          placeholder="Tell us about your cat..."
          className="w-full px-4 py-3 bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
        />
      </div>

      {/* Checkboxes */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isNeutered"
            defaultChecked={initialData?.isNeutered ?? false}
            className="w-4 h-4 accent-brand-orange"
          />
          Neutered / Spayed
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isPublic"
            defaultChecked={initialData?.isPublic ?? true}
            value="on"
          />
          Public profile
          <input type="hidden" name="isPublic" value="off" />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="px-6 py-3 bg-primary text-primary-foreground text-sm uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {pending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
