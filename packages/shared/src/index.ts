import { z } from "zod/v4";

export const APP_NAME = "CatHub";

export const catSexValues = ["male", "female", "unknown"] as const;
export const lineageParentRoleValues = ["sire", "dam", "unknown"] as const;
export const externalParentRoleValues = ["sire", "dam"] as const;

export type CatSex = (typeof catSexValues)[number];
export type LineageParentRole = (typeof lineageParentRoleValues)[number];
export type ExternalParentRole = (typeof externalParentRoleValues)[number];

export const identityCodeSchema = z
  .string()
  .trim()
  .min(1, "Enter the shared identity code")
  .max(32, "Identity code is too long")
  .transform((value) => value.toUpperCase())
  .pipe(
    z.string().regex(
      /^CAT-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/,
      "Use a valid CAT-XXXX-XXXX-XXXX identity code"
    )
  );

export type ApiResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
    };

export type MobileUser = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type MobileAuthToken = {
  accessToken: string;
  expiresAt: string;
};

export type MobileAuthPayload = {
  user: MobileUser;
  token: MobileAuthToken;
};

export type MobileCat = {
  id: string;
  slug: string;
  name: string;
  breed: string | null;
  sex: CatSex | null;
  birthdate: string | null;
  avatarUrl: string | null;
  description: string | null;
  isPublic: boolean | null;
  createdAt: string;
};

export type MobileDashboardPayload = {
  user: MobileUser;
  cats: MobileCat[];
};

export type MobileIdentityCodeLookupPayload = {
  identityCode: string;
  cat: {
    id: string;
    slug: string;
    name: string;
    breed: string | null;
    sex: CatSex | null;
    birthdate: string | null;
    avatarUrl: string | null;
    owner: {
      username: string;
      displayName: string | null;
    };
  };
};

export type MobileLineageRequestPayload = {
  requestId: string;
  status: "pending" | "already_pending" | "already_confirmed";
  message: string;
};

export type MobileCatTimelinePost = {
  id: string;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  mediaType: "none" | "image" | "video" | null;
  isHealthAlert: boolean | null;
  createdAt: string;
};

export type MobileCatHealthRecord = {
  id: string;
  type:
    | "checkup"
    | "vaccination"
    | "surgery"
    | "illness"
    | "medication"
    | "other";
  title: string;
  description: string | null;
  date: string;
  vetName: string | null;
};

export type MobileCatWeightLog = {
  id: string;
  weightKg: string;
  recordedAt: string;
  notes: string | null;
};

export type MobileCatCheckin = {
  id: string;
  date: string;
  appetiteScore: number;
  energyScore: number;
  bowelStatus:
    | "normal"
    | "soft"
    | "hard"
    | "diarrhea"
    | "constipation"
    | "none";
  moodEmoji: string | null;
  notes: string | null;
};

export const MOBILE_TIMELINE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const MOBILE_TIMELINE_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;
export const MOBILE_TIMELINE_CONTENT_MAX = 1000;

export type MobileTimelineCreatePayload = {
  post: MobileCatTimelinePost;
};

export type MobileCatDetailPayload = {
  cat: MobileCat & {
    colorMarkings: string | null;
    isNeutered: boolean | null;
    owner: {
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
    };
    isOwner: boolean;
  };
  recentTimeline: MobileCatTimelinePost[];
  recentHealth: MobileCatHealthRecord[];
  recentWeights: MobileCatWeightLog[];
  latestCheckin: MobileCatCheckin | null;
};
