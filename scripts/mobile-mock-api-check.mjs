#!/usr/bin/env node

import fs from "node:fs";

const checks = [
  {
    file: "mobile/src/lib/mock-api.ts",
    markers: [
      'MOCK_MOBILE_API_MODE = "mock"',
      "MOCK_MOBILE_ACCESS_TOKEN",
      "/api/mobile/auth/login",
      "/api/mobile/auth/register",
      "/api/mobile/auth/me",
      "/api/mobile/dashboard",
      "Mock CatHub API only supports login, register, current user, and dashboard",
    ],
  },
  {
    file: "mobile/src/lib/api.ts",
    markers: ["isMobileMockApiEnabled", "mockMobileRequest", "getAccessToken"],
  },
  {
    file: "mobile/.env.example",
    markers: [
      "EXPO_PUBLIC_MOBILE_API_MODE=live",
      "Set to mock",
      "without a running CatHub API/database",
    ],
  },
  {
    file: "docs/CONTEXT.md",
    markers: [
      "pnpm mobile:mock-api:check",
      "EXPO_PUBLIC_MOBILE_API_MODE=mock",
      "login/current-user/dashboard",
    ],
  },
  {
    file: "DEVLOG.md",
    markers: ["Mobile Mock API First Slice", "pnpm mobile:mock-api:check"],
  },
];

let hasFailure = false;

for (const check of checks) {
  const text = fs.readFileSync(check.file, "utf8");
  for (const marker of check.markers) {
    if (text.includes(marker)) continue;
    console.error(`${check.file} is missing marker: ${marker}`);
    hasFailure = true;
  }
}

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (
  packageJson.scripts?.["mobile:mock-api:check"] !==
  "node scripts/mobile-mock-api-check.mjs"
) {
  console.error("package.json is missing the mobile:mock-api:check script.");
  hasFailure = true;
}

if (hasFailure) {
  process.exit(1);
}

console.log("mobile mock API first-slice markers verified");
