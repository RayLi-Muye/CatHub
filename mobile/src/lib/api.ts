import type {
  ApiResult,
  MobileAuthPayload,
  MobileCatDetailPayload,
  MobileDashboardPayload,
  MobileIdentityCodeLookupPayload,
  MobileLineageRequestPayload,
  MobileUser,
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

  if (init.body && !headers.has("Content-Type")) {
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
