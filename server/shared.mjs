import { randomUUID } from "node:crypto";
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export const fail = (status, message) => {
  throw new HttpError(status, message);
};
export const id = () => randomUUID();
export function text(value, max, required = false) {
  if (
    typeof value !== "string" ||
    value.trim().length > max ||
    (required && !value.trim())
  )
    fail(422, "입력 내용을 확인해주세요.");
  return value.trim();
}
export function username(value) {
  const name = text(value, 30, true);
  if (!/^[a-zA-Z0-9_]{4,30}$/.test(name))
    fail(422, "아이디는 영문·숫자·밑줄 4~30자로 입력해주세요.");
  return name.toLowerCase();
}
export function email(value) {
  const address = text(value, 150, true).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))
    fail(422, "이메일 형식을 확인해주세요.");
  return address;
}
export function integer(value, min, max) {
  if (!Number.isInteger(value) || value < min || value > max)
    fail(422, "숫자 입력 범위를 확인해주세요.");
  return value;
}
export function password(value) {
  if (
    typeof value !== "string" ||
    value.length < 8 ||
    value.length > 128 ||
    !value.trim()
  )
    fail(422, "비밀번호는 8~128자로 입력해주세요.");
  return value;
}
export async function audit(db, user, action, target) {
  await db.run(
    "INSERT INTO audit_logs(id,actor,action,target) VALUES (?,?,?,?)",
    [id(), user.id, action, String(target)],
  );
}
