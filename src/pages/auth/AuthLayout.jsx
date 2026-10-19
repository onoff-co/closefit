import { Link } from "react-router";
import { assetUrl } from "../../lib/assets.js";
export default function AuthLayout({
  signup = false,
  title,
  description,
  next = "/account",
  children,
}) {
  return (
    <section className="auth-layout sql-auth-layout">
      <div className="auth-visual">
        <img
          src={assetUrl("/assets/hanger-shirt.png")}
          alt="클로즈핏 셔츠 컬렉션"
        />
        <div>
          <p className="eyebrow">CLOSER TO YOUR EVERYDAY</p>
          <h2>
            Your fit.
            <br />
            Your everyday.
          </h2>
          <span>당신의 일상에 꼭 맞는, 클로즈핏.</span>
        </div>
      </div>
      <div className="auth-card">
        <p className="eyebrow">CLOSEFIT MEMBERS</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <nav className="auth-tabs" aria-label="회원 메뉴">
          <Link
            to={"/login?next=" + encodeURIComponent(next)}
            className={!signup ? "active" : ""}
          >
            로그인
          </Link>
          <Link
            to={"/signup?next=" + encodeURIComponent(next)}
            className={signup ? "active" : ""}
          >
            회원가입
          </Link>
        </nav>
        {children}
        <div className="auth-bottom">
          <Link to="/">쇼핑 계속하기</Link>
          <span>YOUR EVERYDAY WARDROBE</span>
        </div>
      </div>
    </section>
  );
}
