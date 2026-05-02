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

export type MobileLineageRequestSummary = {
  id: string;
  status: "pending" | "accepted" | "declined" | "canceled";
  parentRole: "sire" | "dam" | "unknown";
  requestNote: string | null;
  responseNote: string | null;
  createdAt: string;
  respondedAt: string | null;
  child: {
    id: string;
    name: string;
    breed: string | null;
    sex: CatSex | null;
    slug: string;
    username: string;
    ownerDisplayName: string | null;
  };
  parent: {
    id: string;
    name: string;
    breed: string | null;
    sex: CatSex | null;
    slug: string;
    username: string;
    ownerDisplayName: string | null;
  };
  requester: {
    username: string;
    displayName: string | null;
  };
  responder: {
    username: string;
    displayName: string | null;
  };
};

export type MobileLineageInboxPayload = {
  incoming: MobileLineageRequestSummary[];
  outgoing: MobileLineageRequestSummary[];
};

export type MobileLineageRespondAction = "accept" | "decline" | "cancel";

export type MobileLineageRespondPayload = {
  request: MobileLineageRequestSummary;
  message: string;
};

export const lineageResponseNoteMax = 500;

export const catNameMax = 100;
export const catBreedMax = 100;
export const catColorMarkingsMax = 255;
export const catDescriptionMax = 2000;
export const catMicrochipMax = 50;

export type MobileCatUpdateInput = {
  name?: string;
  breed?: string | null;
  sex?: CatSex;
  birthdate?: string | null;
  description?: string | null;
  colorMarkings?: string | null;
  microchipId?: string | null;
  isNeutered?: boolean;
  isPublic?: boolean;
};

export type MobileCatUpdatePayload = {
  cat: MobileCatDetailPayload["cat"];
};

export type MobileTimelineListPayload = {
  posts: MobileCatTimelinePost[];
  nextOffset: number | null;
};

export type MobileHealthListPayload = {
  records: MobileCatHealthRecord[];
  nextOffset: number | null;
};

export type MobileWeightListPayload = {
  weights: MobileCatWeightLog[];
};

export const MOBILE_LIST_PAGE_SIZE = 20;

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

export const healthRecordTypeValues = [
  "checkup",
  "vaccination",
  "surgery",
  "illness",
  "medication",
  "other",
] as const;

export type HealthRecordType = (typeof healthRecordTypeValues)[number];

export const healthRecordTitleMax = 200;
export const healthRecordDescriptionMax = 5000;
export const healthRecordVetNameMax = 100;
export const healthRecordVetClinicMax = 200;

export const weightLogNotesMax = 500;
export const weightLogMaxKg = 50;

export type MobileHealthCreatePayload = {
  record: MobileCatHealthRecord;
};

export type MobileWeightCreatePayload = {
  weight: MobileCatWeightLog;
};

export const bowelStatusValues = [
  "normal",
  "soft",
  "hard",
  "diarrhea",
  "constipation",
  "none",
] as const;

export type BowelStatus = (typeof bowelStatusValues)[number];

export const dailyCheckinScoreMin = 1;
export const dailyCheckinScoreMax = 5;
export const dailyCheckinNotesMax = 500;
export const dailyCheckinMoodMax = 10;

export type MobileCheckinCreatePayload = {
  checkin: MobileCatCheckin;
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
