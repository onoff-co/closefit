import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useStore } from "../../state/StoreContext.jsx";
import { request, safeReturn } from "../../lib/api.js";
import AuthLayout from "./AuthLayout.jsx";
import { ErrorBox } from "../../components/Feedback.jsx";
import SocialLoginButtons from "./SocialLoginButtons.jsx";
export default function LoginPage({ demo = false }) {
  const { user, refreshUser } = useStore(),
    location = useLocation(),
    navigate = useNavigate(),
    next = safeReturn(location.search),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await request("/api/auth/login", "POST", {
        username: data.get("username"),
        password: data.get("password"),
      });
      const account = await refreshUser();
      navigate(
        account.admin && next === "/account"
          ? "/admin"
          : next === "/admin" && !account.admin
            ? "/account"
            : next,
      );
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }
  async function socialLogin(provider) {
    setBusy(true);setError("");
    try {
      await request("/api/auth/social", "POST", { provider });
      await refreshUser();
      navigate(next === "/admin" ? "/account" : next);
    } catch (err) { setError(err.message);setBusy(false); }
  }
  return (
    <AuthLayout
      demo={demo}
      title={demo ? "다시 만나서 반가워요." : "클로즈핏에 로그인"}
      description="나의 취향을 담은 옷장을 이어서 만나보세요."
      next={next}
    >
      {user && (
        <p className="auth-session-note">
          {user.profile.name}님으로 로그인 중입니다.{" "}
          <Link to={user.admin ? "/admin" : "/account"}>내 계정으로 이동</Link>
        </p>
      )}
      {demo && <p className="member-demo-note">포트폴리오 체험 화면입니다. 실제 개인정보 대신 예시 정보를 입력해주세요.<br />체험 ID: <b>customer01</b> / 관리자 ID: <b>admin</b><br />비밀번호는 임의의 8자 이상을 입력해주세요.</p>}
      <form onSubmit={submit}>
        <label htmlFor="login-username">
          아이디
          <input
            id="login-username"
            name="username"
            autoComplete="username"
            minLength="4"
            maxLength="30"
            required
            placeholder="아이디를 입력해주세요"
          />
        </label>
        <label htmlFor="login-password">
          비밀번호
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            minLength="8"
            maxLength="128"
            required
            placeholder="비밀번호를 입력해주세요"
          />
        </label>
        <ErrorBox error={error} />
        <button className="primary" disabled={busy}>
          {busy ? "로그인 중…" : "로그인"}
        </button>
      </form>
      <SocialLoginButtons demo={demo} busy={busy} onLogin={socialLogin} />
      <p className="auth-hint">
        아직 회원이 아니신가요?{" "}
        <Link to={"/signup?next=" + encodeURIComponent(next)}>회원가입</Link>
      </p>
    </AuthLayout>
  );
}
