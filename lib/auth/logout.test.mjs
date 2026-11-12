import assert from "node:assert/strict";
import test from "node:test";
import { attemptLogout } from "./logout.ts";

test("reports successful sign-out", async () => {
  let callCount = 0;
  const result = await attemptLogout(async () => {
    callCount += 1;
    return { error: null };
  });

  assert.deepEqual(result, { success: true });
  assert.equal(callCount, 1);
});

test("reports an authentication service error", async () => {
  const result = await attemptLogout(async () => ({
    error: new Error("sign-out rejected"),
  }));

  assert.deepEqual(result, { success: false });
});

test("reports network failures without throwing", async () => {
  const result = await attemptLogout(async () => {
    throw new TypeError("Failed to fetch");
  });

  assert.deepEqual(result, { success: false });
});
