import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/supabase-health.js";

function createResponse() {
  return {
    headers: {},
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(body) {
      this.body = JSON.parse(body);
    },
  };
}

function configuredEnvironment() {
  process.env.CRON_SECRET = "test-cron-secret";
  process.env.VITE_SUPABASE_URL = "https://example.supabase.co";
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
}

test("rejects requests without the cron authorization header", async () => {
  configuredEnvironment();
  const response = createResponse();

  await handler({ method: "GET", headers: {} }, response);

  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.body, { ok: false, error: "Unauthorized." });
});

test("performs one read-only query and does not expose row data", async (t) => {
  configuredEnvironment();
  let requestCount = 0;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    requestCount += 1;
    assert.equal(
      url,
      "https://example.supabase.co/rest/v1/clients?select=id&limit=1",
    );
    assert.equal(options.method, "GET");
    return new Response('[{"id":"private-row-id"}]', { status: 200 });
  });
  const response = createResponse();

  await handler(
    {
      method: "GET",
      headers: { authorization: "Bearer test-cron-secret" },
    },
    response,
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.service, "supabase");
  assert.equal("private-row-id" in response.body, false);
  assert.equal(requestCount, 1);
});

test("returns a sanitized 503 when Supabase is unavailable", async (t) => {
  configuredEnvironment();
  t.mock.method(globalThis, "fetch", async () => {
    throw new TypeError("Failed to fetch secret internal URL");
  });
  t.mock.method(console, "error", () => {});
  const response = createResponse();

  await handler(
    {
      method: "GET",
      headers: { authorization: "Bearer test-cron-secret" },
    },
    response,
  );

  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.body, {
    ok: false,
    error: "Supabase is temporarily unavailable.",
  });
});
