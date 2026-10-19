import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useStore } from "../../state/StoreContext.jsx";
import { request, safeReturn } from "../../lib/api.js";
import AuthLayout from "./AuthLayout.jsx";
import SocialLoginButtons from "./SocialLoginButtons.jsx";
import { ErrorBox } from "../../components/Feedback.jsx";
export default function SignupPage({ demo = false }) {
  const { user, refreshUser } = useStore(),
    location = useLocation(),
    navigate = useNavigate(),
    next = safeReturn(location.search),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (!user && form.get("password") !== form.get("confirmPassword")) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const data = { name: form.get("name"), email: form.get("email"), ...(demo && user ? {consent: true} : {}) };
      if (!user)
        Object.assign(data, {
          username: form.get("username"),
          password: form.get("password"),
          consent: form.get("consent") === "on",
        });
      await request(user ? "/api/profile" : "/api/auth/register", "POST", data);
      await refreshUser();
      navigate(next === "/admin" && !user?.admin ? "/account" : next);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }
  async function socialSignup(provider) {
    setBusy(true);
    setError("");
    try {
      await request("/api/auth/social", "POST", { provider });
      await refreshUser();
      navigate(next === "/admin" ? "/account" : next);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }
  return (
    <AuthLayout
      signup
      title={user ? "회원 정보 수정" : "나에게 맞는 옷장의 시작"}
      description={
        user
          ? "회원 정보를 확인하고 수정해주세요."
          : "클로즈핏 회원이 되어 취향을 모아보세요."
      }
      next={next}
    >
      <form className={!user ? "member-form--signup" : undefined} onSubmit={submit}>
        {!user && (
          <label htmlFor="signup-username">
            아이디
            <input
              id="signup-username"
              name="username"
              autoComplete="username"
              pattern="[A-Za-z0-9_]{4,30}"
              minLength="4"
              maxLength="30"
              required
              placeholder="영문·숫자·밑줄 4~30자"
            />
          </label>
        )}
        <label htmlFor="signup-name">
          이름 / 닉네임
          <input
            id="signup-name"
            name="name"
            autoComplete="nickname"
            maxLength="40"
            defaultValue={user?.profile.name || ""}
            required
            placeholder="이름 또는 닉네임을 입력해주세요"
          />
        </label>
        <label className="member-field--wide" htmlFor="signup-email">
          이메일
          <input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength="150"
            defaultValue={user?.email || ""}
            required
            placeholder="이메일을 입력해주세요"
          />
        </label>
        {!user && (
          <>
            <label htmlFor="signup-password">
              비밀번호
              <input
                id="signup-password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength="8"
                maxLength="128"
                required
                placeholder="8자 이상 입력해주세요"
              />
            </label>
            <label htmlFor="signup-confirm">
              비밀번호 확인
              <input
                id="signup-confirm"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength="8"
                maxLength="128"
                required
                placeholder="비밀번호를 다시 입력해주세요"
              />
            </label>
            <label className="consent">
              <input name="consent" type="checkbox" required /> [필수] 회원 정보
              저장에 동의합니다.
            </label>
          </>
        )}
        <ErrorBox error={error} />
        <button className="primary" disabled={busy}>
          {busy ? "저장 중…" : user ? "프로필 저장" : "회원가입"}
        </button>
      </form>
      {!user && <SocialLoginButtons signup busy={busy} onLogin={socialSignup} />}
    </AuthLayout>
  );
}
