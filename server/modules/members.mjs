import {
  fail,
  text,
  username,
  email,
  password,
  id,
  audit,
} from "../shared.mjs";
import { hashPassword } from "../passwords.mjs";
const fields = "id,username,email,name,role,created_at";
export const listMembers = (db) =>
  db.all("SELECT " + fields + " FROM members ORDER BY created_at DESC");
export async function getMember(db, memberId) {
  const row = await db.get("SELECT " + fields + " FROM members WHERE id=?", [
    memberId,
  ]);
  if (!row) fail(404, "회원이 없습니다.");
  return row;
}
export async function createMember(db, body, actor) {
  if (body.role !== undefined && body.role !== "customer")
    fail(422, "가입 시 관리자 권한을 지정할 수 없습니다.");
  const login = username(body.username),
    address = email(body.email),
    name = text(body.name, 40, true),
    secret = password(body.password);
  if (
    await db.get("SELECT id FROM members WHERE username=? OR email=?", [
      login,
      address,
    ])
  )
    fail(409, "이미 사용 중인 아이디 또는 이메일입니다.");
  const hashed = await hashPassword(secret),
    memberId = id();
  try {
    return await db.transaction(async (tx) => {
      await tx.run(
        "INSERT INTO members(id,username,email,name,password_hash,role) VALUES (?,?,?,?,?,'customer')",
        [memberId, login, address, name, hashed],
      );
      if (actor) await audit(tx, actor, "member.create", memberId);
      return { id: memberId };
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY")
      fail(409, "이미 사용 중인 아이디 또는 이메일입니다.");
    throw error;
  }
}
export async function updateMember(db, memberId, body, actor) {
  return db.transaction(async (tx) => {
    const previous = await getMember(tx, memberId);
    if (
      body.role !== undefined ||
      body.password !== undefined ||
      body.username !== undefined
    )
      fail(422, "이 화면에서 아이디·비밀번호·권한을 변경할 수 없습니다.");
    const name = text(body.name ?? previous.name, 40, true),
      address = email(body.email ?? previous.email);
    await tx.run("UPDATE members SET name=?,email=? WHERE id=?", [
      name,
      address,
      memberId,
    ]);
    await audit(tx, actor, "member.patch", memberId);
    return { ok: true };
  });
}
export async function deleteMember(db, memberId, actor) {
  return db.transaction(async (tx) => {
    const member = await getMember(tx, memberId);
    if (member.role === "admin") fail(409, "관리자 계정은 삭제할 수 없습니다.");
    await tx.run("DELETE FROM members WHERE id=?", [memberId]);
    await audit(tx, actor, "member.delete", memberId);
    return { ok: true };
  });
}
