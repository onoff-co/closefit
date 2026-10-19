import { randomBytes, scrypt as rawScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(rawScrypt),
  options = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex"),
    key = await scrypt(password, salt, 64, options);
  return ["scrypt", "131072", "8", "1", salt, key.toString("hex")].join("$");
}
export async function verifyPassword(password, encoded) {
  if (typeof password !== "string" || password.length > 128) return false;
  if (!encoded) {
    await scrypt(password, randomBytes(16).toString("hex"), 64, options);
    return false;
  }
  const [kind, n, r, p, salt, hex] = encoded.split("$");
  if (
    kind !== "scrypt" ||
    n !== "131072" ||
    r !== "8" ||
    p !== "1" ||
    !/^[a-f0-9]{32}$/.test(salt || "") ||
    !/^[a-f0-9]{128}$/.test(hex || "")
  )
    return false;
  const key = await scrypt(password, salt, 64, options);
  return timingSafeEqual(key, Buffer.from(hex, "hex"));
}
