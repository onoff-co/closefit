// Portfolio-only identity simulation. Passwords are validated for form UX and never stored.
import { demoAdminId, demoCustomerId } from "./seed.js";
const providers = { kakao: "카카오", google: "구글", naver: "네이버" };
const fail = (status, message) => { const error = Error(message); error.status = status; throw error; };
function credentials(input) {
  const username = String(input?.username || "").trim();
  if (!/^[A-Za-z0-9_]{4,30}$/.test(username)) fail(422, "아이디는 영문·숫자·밑줄 4~30자로 입력해주세요.");
  if (typeof input?.password !== "string" || input.password.length < 8 || input.password.length > 128)
    fail(422, "체험용 비밀번호를 8~128자로 입력해주세요.");
  return username;
}
export function registerDemoMember(data, input) {
  const username = credentials(input), name = String(input?.name || "").trim(), email = String(input?.email || "").trim();
  if (!name || name.length > 40 || email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || input?.consent !== true)
    fail(422, "가입 정보와 회원 정보 저장 동의를 확인해주세요.");
  if (["admin", "customer01"].includes(username.toLowerCase()) || data.members.some(m => m.username?.toLowerCase() === username.toLowerCase() || m.email.toLowerCase() === email.toLowerCase()))
    fail(409, "이미 사용 중인 아이디 또는 이메일입니다.");
  const profile = { id: crypto.randomUUID(), username, name, email, created_at: new Date().toISOString().slice(0,19).replace("T", " ") };
  data.members.push(profile);
  data.session = profile.id;
}
export function loginDemoMember(data, input) {
  const username = credentials(input).toLowerCase();
  const reserved = username === "admin" ? demoAdminId : username === "customer01" ? demoCustomerId : null;
  const profile = data.members.find(m => reserved ? m.id === reserved : m.username?.toLowerCase() === username);
  if (!profile) fail(401, "가입한 체험 아이디를 확인해주세요.");
  data.session = profile.id;
}
export function socialDemoMember(data, provider) {
  if (!Object.hasOwn(providers, provider)) fail(422, "로그인 서비스를 확인해주세요.");
  let profile = data.members.find(m => m.id === "demo-social-" + provider);
  if (!profile) {
    profile = { id: "demo-social-" + provider, name: providers[provider] + " 체험회원", email: provider + "@example.test", created_at: new Date().toISOString().slice(0,19).replace("T", " ") };
    data.members.push(profile);
  }
  data.session = profile.id;
}
