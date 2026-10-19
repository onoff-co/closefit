import { randomBytes, createHash } from "node:crypto";
import { verifyPassword } from "./passwords.mjs";
import { fail, username, password } from "./shared.mjs";
const hash = (value) => createHash("sha256").update(value).digest("hex");
function cookieToken(req) {
  return /(?:^|;\s*)closefit-session=([a-f0-9]{64})(?:;|$)/.exec(
    req.headers.cookie || "",
  )?.[1];
}
export async function currentUser(db, req) {
  const token = cookieToken(req);
  if (!token) return null;
  const profile = await db.get(
    "SELECT m.id,m.username,m.email,m.name,m.role,m.created_at FROM sessions s JOIN members m ON m.id=s.member_id WHERE s.token_hash=? AND s.expires_at>UTC_TIMESTAMP()",
    [hash(token)],
  );
  return profile
    ? {
        id: profile.id,
        email: profile.email,
        admin: profile.role === "admin",
        profile,
      }
    : null;
}
export function requireUser(user) {
  if (!user) fail(401, "로그인이 필요합니다.");
  return user;
}
export function requireAdmin(user) {
  requireUser(user);
  if (!user.admin) fail(403, "관리자만 이용할 수 있습니다.");
}
export async function clearSession(db, req, res) {
  const token = cookieToken(req);
  if (token)
    await db.run("DELETE FROM sessions WHERE token_hash=?", [hash(token)]);
  res.setHeader(
    "Set-Cookie",
    "closefit-session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0",
  );
}
export async function startSession(db, req, res, memberId) {
  await clearSession(db, req, res);
  const token = randomBytes(32).toString("hex");
  await db.run("DELETE FROM sessions WHERE expires_at<=UTC_TIMESTAMP()");
  await db.run(
    "INSERT INTO sessions(token_hash,member_id,expires_at) VALUES (?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 8 HOUR))",
    [hash(token), memberId],
  );
  res.setHeader(
    "Set-Cookie",
    "closefit-session=" +
      token +
      "; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800",
  );
}
export async function login(db, req, res, body) {
  const name = username(body.username),
    secret = password(body.password),
    member = await db.get(
      "SELECT id,password_hash FROM members WHERE username=?",
      [name],
    );
  if (!(await verifyPassword(secret, member?.password_hash)))
    fail(401, "아이디 또는 비밀번호가 올바르지 않습니다.");
  await startSession(db, req, res, member.id);
  return { ok: true };
}
