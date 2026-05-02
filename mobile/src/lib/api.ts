import type {
  ApiResult,
  BowelStatus,
  HealthRecordType,
  MobileAuthPayload,
  MobileCatDetailPayload,
  MobileCheckinCreatePayload,
  MobileDashboardPayload,
  MobileHealthCreatePayload,
  MobileIdentityCodeLookupPayload,
  MobileLineageInboxPayload,
  MobileLineageRequestPayload,
  MobileLineageRespondAction,
  MobileLineageRespondPayload,
  MobileTimelineCreatePayload,
  MobileUser,
  MobileWeightCreatePayload,
} from "@cathub/shared";
import { Platform } from "react-native";
import { getAccessToken, setAccessToken } from "./token-store";

const DEFAULT_API_BASE_URL =
  Platform.OS === "web" ? "http://localhost:3000" : "http://localhost:3000";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  DEFAULT_API_BASE_URL;

async function request<T>(
  path: string,
  init: RequestInit = {}
): Promise<ApiResult<T>> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  // Only auto-set Content-Type for non-FormData JSON bodies. FormData must
  // let fetch generate its own multipart/form-data boundary header.
  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;
  const hasBody = init.body !== undefined && init.body !== null;
  if (hasBody && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = await getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    });
    const json = (await response.json()) as ApiResult<T>;
    return json;
  } catch {
    return {
      ok: false,
      error: "Could not reach CatHub API",
    };
  }
}

export async function login(email: string, password: string) {
  const result = await request<MobileAuthPayload>("/api/mobile/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (result.ok) {
    await setAccessToken(result.data.token.accessToken);
  }

  return result;
}

export async function register(
  username: string,
  email: string,
  password: string
) {
  const result = await request<MobileAuthPayload>("/api/mobile/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });

  if (result.ok) {
    await setAccessToken(result.data.token.accessToken);
  }

  return result;
}

export async function getMe() {
  return request<{ user: MobileUser }>("/api/mobile/auth/me");
}

export async function getDashboard() {
  return request<MobileDashboardPayload>("/api/mobile/dashboard");
}

export async function getCatDetail(catId: string) {
  return request<MobileCatDetailPayload>(
    `/api/mobile/cats/${encodeURIComponent(catId)}`
  );
}

export type MobileTimelineImageInput = {
  uri: string;
  mimeType: string;
  fileName: string;
};

export async function createTimelinePost(
  catId: string,
  input: {
    content: string;
    image?: MobileTimelineImageInput | null;
    isHealthAlert?: boolean;
    tags?: string[];
  }
): Promise<ApiResult<MobileTimelineCreatePayload>> {
  const form = new FormData();
  form.append("content", input.content);
  if (input.isHealthAlert) form.append("isHealthAlert", "true");
  if (input.tags && input.tags.length > 0) {
    form.append("tags", input.tags.join(","));
  }
  if (input.image) {
    // React Native FormData accepts { uri, name, type } file objects.
    form.append("image", {
      uri: input.image.uri,
      name: input.image.fileName,
      type: input.image.mimeType,
    } as unknown as Blob);
  }

  return request<MobileTimelineCreatePayload>(
    `/api/mobile/cats/${encodeURIComponent(catId)}/timeline`,
    { method: "POST", body: form as unknown as BodyInit }
  );
}

export async function createHealthRecord(
  catId: string,
  input: {
    type: HealthRecordType;
    title: string;
    description?: string | null;
    date: string;
    vetName?: string | null;
    vetClinic?: string | null;
  }
) {
  return request<MobileHealthCreatePayload>(
    `/api/mobile/cats/${encodeURIComponent(catId)}/health`,
    { method: "POST", body: JSON.stringify(input) }
  );
}

export async function createWeightLog(
  catId: string,
  input: { weightKg: string; recordedAt: string; notes?: string | null }
) {
  return request<MobileWeightCreatePayload>(
    `/api/mobile/cats/${encodeURIComponent(catId)}/weights`,
    { method: "POST", body: JSON.stringify(input) }
  );
}

export async function getLineageInbox() {
  return request<MobileLineageInboxPayload>("/api/mobile/lineage/requests");
}

export async function respondLineageRequest(
  requestId: string,
  input: { action: MobileLineageRespondAction; responseNote?: string | null }
) {
  return request<MobileLineageRespondPayload>(
    `/api/mobile/lineage/requests/${encodeURIComponent(requestId)}`,
    { method: "PATCH", body: JSON.stringify(input) }
  );
}

export async function createDailyCheckin(
  catId: string,
  input: {
    date: string;
    appetiteScore: number;
    energyScore: number;
    bowelStatus: BowelStatus;
    moodEmoji?: string | null;
    notes?: string | null;
  }
) {
  return request<MobileCheckinCreatePayload>(
    `/api/mobile/cats/${encodeURIComponent(catId)}/checkins`,
    { method: "POST", body: JSON.stringify(input) }
  );
}

export async function lookupIdentityCode(identityCode: string) {
  return request<MobileIdentityCodeLookupPayload>(
    `/api/mobile/connect/identity-code?code=${encodeURIComponent(identityCode)}`
  );
}

export async function createLineageConnectionRequest(input: {
  childCatId: string;
  identityCode: string;
  parentRole: "sire" | "dam";
  requestNote?: string;
}) {
  return request<MobileLineageRequestPayload>(
    "/api/mobile/connect/identity-code",
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
}
