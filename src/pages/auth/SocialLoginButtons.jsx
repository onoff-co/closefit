const providers = [
  { id: "kakao", name: "카카오" },
  { id: "google", name: "구글" },
  { id: "naver", name: "네이버" },
];

function ProviderLogo({ provider }) {
  if (provider === "kakao") {
    return <svg viewBox="0 0 24 24" focusable="false"><path d="M12 3C6.5 3 2 6.5 2 10.8c0 2.8 1.9 5.2 4.7 6.6L5.6 21l4.3-2.6c.7.1 1.4.2 2.1.2 5.5 0 10-3.5 10-7.8S17.5 3 12 3Z" fill="currentColor" /></svg>;
  }
  if (provider === "naver") {
    return <svg viewBox="0 0 24 24" focusable="false"><path d="M16.273 12.845 7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727Z" fill="currentColor" /></svg>;
  }
  return (
    <svg viewBox="0 0 48 48" focusable="false">
      <path fill="#4285F4" d="M43.61 24.46c0-1.36-.12-2.66-.35-3.92H24v7.42h11a9.4 9.4 0 0 1-4.08 6.17v5h6.61c3.86-3.55 6.08-8.78 6.08-14.67Z" />
      <path fill="#34A853" d="M24 44c5.51 0 10.13-1.83 13.51-4.95l-6.61-5c-1.83 1.23-4.17 1.96-6.9 1.96-5.31 0-9.81-3.59-11.42-8.42H5.75v5.16A20 20 0 0 0 24 44Z" />
      <path fill="#FBBC05" d="M12.58 27.59a12 12 0 0 1 0-7.18v-5.16H5.75a20 20 0 0 0 0 17.5Z" />
      <path fill="#EA4335" d="M24 11.99c3 0 5.69 1.03 7.81 3.05l5.86-5.86A19.61 19.61 0 0 0 24 4 20 20 0 0 0 5.75 15.25l6.83 5.16C14.19 15.58 18.69 11.99 24 11.99Z" />
    </svg>
  );
}

export default function SocialLoginButtons({ signup = false, busy = false, onLogin }) {
  return (
    <div className="member-social">
      <div className="member-social__divider">
        <span>{signup ? "소셜 계정으로 간편 가입" : "소셜 계정으로 간편 로그인"}</span>
      </div>
      <div className="member-social__buttons">
        {providers.map(({ id, name }) => {
          const label = name + "로 " + (signup ? "가입하기" : "로그인");
          return (
            <button key={id} type="button"
              className={"member-social__button member-social__button--" + id}
              disabled={busy} aria-label={label} title={label}
              onClick={() => onLogin(id)}>
              <span className="member-social__mark" aria-hidden="true">
                <ProviderLogo provider={id} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
