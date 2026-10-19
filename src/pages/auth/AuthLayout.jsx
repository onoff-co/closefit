import { Link } from "react-router";
import { assetUrl } from "../../lib/assets.js";

export default function AuthLayout({
  signup = false,
  title,
  description,
  next = "/account",
  demo = false,
  children,
}) {
  return (
    <section className="member-auth" aria-labelledby="member-auth-title">
      <aside className="member-auth__editorial" aria-label="클로즈핏 브랜드">
        <div className="member-auth__editorial-heading">
          <p className="eyebrow">THE EVERYDAY COLLECTION</p>
          <h2>Good clothes.<br /><em>Better days.</em></h2>
          <p>매일 손이 가는 옷, 나에게 가까운 핏.</p>
        </div>
        <img src={assetUrl("/assets/hanger-shirt.png")} alt="나무 옷걸이에 걸린 내추럴 베이지 셔츠" width="1024" height="1536" />
        <div className="member-auth__editorial-caption">
          <span>CLOSEFIT ESSENTIALS</span>
          <span>일상에 오래 머무는 취향</span>
        </div>
      </aside>
      <div className="member-auth__form-panel">
        <div className="member-auth__heading">
          <p className="eyebrow">CLOSEFIT MEMBERS{demo ? " / DEMO" : ""}</p>
          <h1 id="member-auth-title">{title}</h1>
          <p>{description}</p>
        </div>
        <nav className="member-auth__tabs" aria-label="회원 메뉴">
          <Link to={"/login?next=" + encodeURIComponent(next)} aria-current={!signup ? "page" : undefined}>로그인</Link>
          <Link to={"/signup?next=" + encodeURIComponent(next)} aria-current={signup ? "page" : undefined}>회원가입</Link>
        </nav>
        <div className="member-auth__content">{children}</div>
        <div className="member-auth__footer">
          <Link to="/">쇼핑 계속하기</Link>
          <span>YOUR EVERYDAY WARDROBE</span>
        </div>
      </div>
    </section>
  );
}
