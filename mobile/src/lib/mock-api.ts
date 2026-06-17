import type {
  ApiResult,
  MobileAuthPayload,
  MobileDashboardPayload,
  MobileUser,
} from "@cathub/shared";

export const MOCK_MOBILE_API_MODE = "mock";
export const MOCK_MOBILE_ACCESS_TOKEN = "mock-cathub-access-token";

const MOCK_USER: MobileUser = {
  id: "mock-user-1",
  email: "owner@example.test",
  username: "mock-owner",
  displayName: "Mock Owner",
  avatarUrl: null,
};

const MOCK_DASHBOARD: MobileDashboardPayload = {
  user: MOCK_USER,
  cats: [
    {
      id: "mock-cat-miso",
      slug: "miso",
      name: "Miso",
      breed: "Domestic Shorthair",
      sex: "female",
      birthdate: "2021-04-12",
      avatarUrl: null,
      description: "Curious, food-motivated, and ready for local UI previews.",
      isPublic: true,
      createdAt: "2026-06-18T00:00:00.000Z",
    },
    {
      id: "mock-cat-soba",
      slug: "soba",
      name: "Soba",
      breed: "British Shorthair",
      sex: "male",
      birthdate: "2020-09-03",
      avatarUrl: null,
      description: "A calm reference cat for empty-state and list-card checks.",
      isPublic: false,
      createdAt: "2026-06-18T00:00:00.000Z",
    },
  ],
};

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

function authPayload(): MobileAuthPayload {
  return {
    user: MOCK_USER,
    token: {
      accessToken: MOCK_MOBILE_ACCESS_TOKEN,
      expiresAt: "2099-01-01T00:00:00.000Z",
    },
  };
}

function isMockToken(token: string | null) {
  return token === MOCK_MOBILE_ACCESS_TOKEN;
}

export function isMobileMockApiEnabled() {
  return process.env.EXPO_PUBLIC_MOBILE_API_MODE === MOCK_MOBILE_API_MODE;
}

export async function mockMobileRequest<T>(
  path: string,
  init: RequestInit,
  accessToken: string | null
): Promise<ApiResult<T>> {
  const method = (init.method ?? "GET").toUpperCase();
  const route = path.split("?")[0];

  if (
    method === "POST" &&
    (route === "/api/mobile/auth/login" ||
      route === "/api/mobile/auth/register")
  ) {
    return ok(authPayload() as T);
  }

  if (!isMockToken(accessToken)) {
    return {
      ok: false,
      error: "Mock CatHub API session is not signed in.",
    };
  }

  if (method === "GET" && route === "/api/mobile/auth/me") {
    return ok({ user: MOCK_USER } as T);
  }

  if (method === "GET" && route === "/api/mobile/dashboard") {
    return ok(MOCK_DASHBOARD as T);
  }

  return {
    ok: false,
    error:
      "Mock CatHub API only supports login, register, current user, and dashboard in this slice.",
  };
}
