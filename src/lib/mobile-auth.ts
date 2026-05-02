import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;
const TOKEN_TYPE = "mobile-access";

type MobileTokenPayload = {
  sub: string;
  iat: number;
  exp: number;
  typ: typeof TOKEN_TYPE;
};

export type MobileAuthUser = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

function getSecret() {
  const secret =
    process.env.MOBILE_AUTH_SECRET ??
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET;

  if (secret) return secret;

  if (process.env.NODE_ENV !== "production") {
    return "cathub-local-mobile-auth-secret";
  }

  throw new Error("MOBILE_AUTH_SECRET is required in production");
}

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", getSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function verifySignature(encodedPayload: string, signature: string) {
  const expected = signPayload(encodedPayload);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  return (
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}

export function createMobileAccessToken(userId: string) {
  const now = Math.floor(Date.now() / 1000);
  const payload: MobileTokenPayload = {
    sub: userId,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
    typ: TOKEN_TYPE,
  };
  const encodedPayload = encode(payload);

  return {
    accessToken: `${encodedPayload}.${signPayload(encodedPayload)}`,
    expiresAt: new Date(payload.exp * 1000).toISOString(),
  };
}

export function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice("Bearer ".length).trim() || null;
}

export function verifyMobileAccessToken(token: string) {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;
  if (!verifySignature(encodedPayload, signature)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as Partial<MobileTokenPayload>;

    if (
      payload.typ !== TOKEN_TYPE ||
      typeof payload.sub !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload as MobileTokenPayload;
  } catch {
    return null;
  }
}

export async function getMobileAuthUser(request: Request) {
  const token = getBearerToken(request);
  if (!token) return null;

  const payload = verifyMobileAccessToken(token);
  if (!payload) return null;

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, payload.sub))
    .limit(1);

  return user ?? null;
}

export function serializeMobileUser(user: MobileAuthUser) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  };
}
