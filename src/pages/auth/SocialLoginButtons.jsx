import { useState } from "react";
const providers = [
  { id: "kakao", name: "카카오" },
  { id: "google", name: "구글" },
  { id: "naver", name: "네이버" },
];
export default function SocialLoginButtons({ demo = false, busy = false, onLogin }) {
  const [notice, setNotice] = useState("");
  return (
    <div className="member-social">
      <div className="member-social__divider"><span>소셜 계정으로 간편 로그인</span></div>
      <div className="member-social__buttons">
        {providers.map(({ id, name }) => (
          <button key={id} type="button" className={"member-social__button member-social__button--" + id} disabled={busy}
            onClick={() => demo ? onLogin(id) : setNotice(name + " 로그인은 준비 중입니다. 아이디로 로그인해주세요.")}>
            <span className="member-social__mark" aria-hidden="true">
              {id === "kakao" ? <svg viewBox="0 0 24 24" focusable="false"><path d="M12 3C6.5 3 2 6.5 2 10.8c0 2.8 1.9 5.2 4.7 6.6L5.6 21l4.3-2.6c.7.1 1.4.2 2.1.2 5.5 0 10-3.5 10-7.8S17.5 3 12 3Z" fill="currentColor"/></svg> : id === "google" ? "G" : "N"}
            </span>
            {name}로 로그인
          </button>
        ))}
      </div>
      {!demo && notice && <p className="member-social__notice" role="status">{notice}</p>}
      {demo && <p className="member-social__notice">소셜 로그인은 실제 계정 연동 없이 체험 계정으로 진행됩니다.</p>}
    </div>
  );
}
