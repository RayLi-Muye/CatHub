import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

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

function getUploadConfig() {
  const projectRoot = /* turbopackIgnore: true */ process.cwd();
  const publicRoot = path.join(projectRoot, "public");
  const uploadRoot = path.resolve(
    /* turbopackIgnore: true */ projectRoot,
    process.env.UPLOAD_DIR ?? "./public/uploads"
  );
  const relativeToPublic = path.relative(publicRoot, uploadRoot);

  if (
    relativeToPublic.startsWith("..") ||
    path.isAbsolute(relativeToPublic) ||
    relativeToPublic === ""
  ) {
    throw new Error("UPLOAD_DIR must point to a subdirectory inside ./public");
  }

  const publicBasePath = `/${relativeToPublic.split(path.sep).join("/")}`;

  return {
    publicBasePath,
    uploadRoot,
  };
}

function isNonEmptyFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

function getFileExtension(file: File) {
  const fromMime = MIME_TO_EXTENSION[file.type];
  if (fromMime) return fromMime;

  const fromName = path.extname(file.name).toLowerCase();
  if (Object.values(MIME_TO_EXTENSION).includes(fromName)) {
    return fromName;
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

  const { publicBasePath, uploadRoot } = getUploadConfig();
  const filename = `${slug}-${catId}-${randomUUID()}${extension}`;
  const destinationPath = path.join(uploadRoot, filename);
  const arrayBuffer = await file.arrayBuffer();

  await mkdir(uploadRoot, { recursive: true });
  await writeFile(destinationPath, Buffer.from(arrayBuffer));

  return {
    filename,
    mimeType: file.type,
    publicUrl: `${publicBasePath}/${filename}`,
    sizeBytes: file.size,
  };
}

export async function deleteStoredAvatar(publicUrl: string | null | undefined) {
  if (!publicUrl) return;

  const { publicBasePath, uploadRoot } = getUploadConfig();
  const prefix = `${publicBasePath}/`;

  if (!publicUrl.startsWith(prefix)) return;

  const relativeFilename = publicUrl.slice(prefix.length);
  if (!relativeFilename) return;

  const filePath = path.join(uploadRoot, relativeFilename);

  try {
    await unlink(filePath);
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !("code" in error) ||
      error.code !== "ENOENT"
    ) {
      throw error;
    }
  }
}
