#!/usr/bin/env node

import fs from "node:fs";

const checks = [
  {
    file: "mobile/src/lib/api.ts",
    markers: [
      "EXPO_PUBLIC_API_PORT",
      '|| "3000"',
      "http://localhost:${DEFAULT_API_PORT}",
      "EXPO_PUBLIC_API_BASE_URL",
    ],
  },
  {
    file: "mobile/.env.example",
    markers: [
      "EXPO_PUBLIC_API_BASE_URL=http://localhost:3000",
      "EXPO_PUBLIC_API_PORT=3000",
      "This full URL overrides",
      "port 3000 is already busy",
    ],
  },
  {
    file: "docs/CONTEXT.md",
    markers: [
      "pnpm mobile:dev-api:check",
      "EXPO_PUBLIC_API_PORT",
      "EXPO_PUBLIC_API_BASE_URL",
      "port 3000 is busy",
    ],
  },
  {
    file: "DEVLOG.md",
    markers: [
      "Mobile Dev API Port Override",
      "pnpm mobile:dev-api:check",
    ],
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
if (packageJson.scripts?.["mobile:dev-api:check"] !== "node scripts/mobile-dev-api-check.mjs") {
  console.error("package.json is missing the mobile:dev-api:check script.");
  hasFailure = true;
}

if (hasFailure) {
  process.exit(1);
}

console.log("mobile dev API fallback config markers verified");
