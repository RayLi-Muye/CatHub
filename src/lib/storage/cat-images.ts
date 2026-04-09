import { randomUUID } from "node:crypto";
import { put, del } from "@vercel/blob";

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/gif": ".gif",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export const MAX_CAT_AVATAR_SIZE = 5 * 1024 * 1024;

type StoredCatImage = {
  filename: string;
  mimeType: string;
  publicUrl: string;
  sizeBytes: number;
};

function isNonEmptyFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

function getFileExtension(file: File) {
  const fromMime = MIME_TO_EXTENSION[file.type];
  if (fromMime) return fromMime;

  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && Object.values(MIME_TO_EXTENSION).includes(`.${fromName}`)) {
    return `.${fromName}`;
  }

  return null;
}

export function getAvatarFile(formData: FormData) {
  const value = formData.get("avatar");
  return isNonEmptyFile(value) ? value : null;
}

export function validateAvatarFile(file: File | null) {
  if (!file) return null;

  if (!(file.type in MIME_TO_EXTENSION)) {
    return "Avatar must be a PNG, JPG, WEBP, or GIF image";
  }

  if (file.size > MAX_CAT_AVATAR_SIZE) {
    return "Avatar must be 5 MB or smaller";
  }

  if (!getFileExtension(file)) {
    return "Avatar file extension is not supported";
  }

  return null;
}

export async function saveCatAvatar({
  catId,
  file,
  slug,
}: {
  catId: string;
  file: File;
  slug: string;
}): Promise<StoredCatImage> {
  const extension = getFileExtension(file);
  if (!extension) {
    throw new Error("Unsupported avatar file extension");
  }

  const filename = `${slug}-${catId}-${randomUUID()}${extension}`;
  const pathname = `cats/${filename}`;

  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
  });

  return {
    filename,
    mimeType: file.type,
    publicUrl: blob.url,
    sizeBytes: file.size,
  };
}

export async function deleteStoredAvatar(publicUrl: string | null | undefined) {
  if (!publicUrl) return;

  // Only delete Vercel Blob URLs (skip legacy local paths like /uploads/...)
  if (!publicUrl.startsWith("https://")) return;

  try {
    await del(publicUrl);
  } catch {
    // Silently ignore deletion failures (blob may already be deleted)
  }
}
