import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../server/passwords.mjs";
import { username, email, password } from "../server/shared.mjs";
test("passwords use salted hashes and constant-time verification", async () => {
  const value = "unit-test-passphrase",
    first = await hashPassword(value),
    second = await hashPassword(value);
  assert.notEqual(first, second);
  assert.ok(!first.includes(value));
  assert.equal(await verifyPassword(value, first), true);
  assert.equal(await verifyPassword("incorrect-passphrase", first), false);
  assert.equal(await verifyPassword(value, "invalid-hash"), false);
});
test("SQL auth input validation rejects ambiguous identifiers and invalid credentials", () => {
  assert.equal(username("Customer_01"), "customer_01");
  assert.throws(() => username("admin' OR 1=1"), { status: 422 });
  assert.throws(() => password("short"), { status: 422 });
  assert.throws(() => email("invalid"), { status: 422 });
  assert.equal(email("CUSTOMER@example.test"), "customer@example.test");
});
