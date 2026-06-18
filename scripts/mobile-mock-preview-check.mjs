#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const sourcePath = "mobile/src/lib/mock-api.ts";
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    esModuleInterop: true,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: sourcePath,
});

const moduleContext = { exports: {} };
const context = {
  console,
  exports: moduleContext.exports,
  module: moduleContext,
  process: {
    env: {
      EXPO_PUBLIC_MOBILE_API_MODE: "mock",
    },
  },
};

vm.runInNewContext(compiled.outputText, context, {
  filename: "mobile/src/lib/mock-api.js",
});

const {
  MOCK_MOBILE_ACCESS_TOKEN,
  isMobileMockApiEnabled,
  mockMobileRequest,
} = moduleContext.exports;

assert.equal(
  isMobileMockApiEnabled(),
  true,
  "mock mode should be enabled when EXPO_PUBLIC_MOBILE_API_MODE=mock",
);

const signedOutMe = await mockMobileRequest(
  "/api/mobile/auth/me",
  { method: "GET" },
  null,
);
assert.equal(signedOutMe.ok, false, "current user should require a mock token");
assert.match(signedOutMe.error, /not signed in/i);

const login = await mockMobileRequest(
  "/api/mobile/auth/login",
  { method: "POST", body: JSON.stringify({ email: "owner@example.test" }) },
  null,
);
assert.equal(login.ok, true, "mock login should return a successful payload");
assert.equal(login.data.token.accessToken, MOCK_MOBILE_ACCESS_TOKEN);
assert.equal(login.data.user.username, "mock-owner");

const me = await mockMobileRequest(
  "/api/mobile/auth/me",
  { method: "GET" },
  login.data.token.accessToken,
);
assert.equal(me.ok, true, "mock current user should accept the mock token");
assert.equal(me.data.user.id, login.data.user.id);

const dashboard = await mockMobileRequest(
  "/api/mobile/dashboard",
  { method: "GET" },
  login.data.token.accessToken,
);
assert.equal(dashboard.ok, true, "mock dashboard should return a payload");
assert.equal(dashboard.data.user.id, login.data.user.id);
assert.equal(
  dashboard.data.cats.length >= 1,
  true,
  "mock dashboard should include at least one cat",
);
assert.equal(typeof dashboard.data.cats[0].name, "string");

const unsupported = await mockMobileRequest(
  "/api/mobile/cats/mock-cat-miso",
  { method: "GET" },
  login.data.token.accessToken,
);
assert.equal(
  unsupported.ok,
  false,
  "mock cat detail should stay unsupported in the first slice",
);
assert.match(unsupported.error, /only supports login, register, current user, and dashboard/i);

context.process.env.EXPO_PUBLIC_MOBILE_API_MODE = "live";
assert.equal(
  isMobileMockApiEnabled(),
  false,
  "mock mode should be disabled outside EXPO_PUBLIC_MOBILE_API_MODE=mock",
);

console.log("mobile mock preview smoke verified");
