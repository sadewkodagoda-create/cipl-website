import test from "node:test";
import assert from "node:assert/strict";
import {
  getAuthErrorMessage,
  TEMPORARY_AUTH_ERROR,
} from "../src/lib/authErrors.js";

test("network errors become a clear temporary server message", () => {
  assert.equal(
    getAuthErrorMessage(new TypeError("Failed to fetch")),
    TEMPORARY_AUTH_ERROR,
  );
});

test("authentication errors remain specific", () => {
  assert.equal(
    getAuthErrorMessage({ message: "Invalid login credentials" }),
    "Invalid login credentials",
  );
});
