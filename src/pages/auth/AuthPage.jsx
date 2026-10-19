import { isSqlMode } from "../../lib/api.js";
import LoginPage from "./LoginPage.jsx";
import SignupPage from "./SignupPage.jsx";

export default function AuthPage({ signup = false }) {
  return signup ? <SignupPage demo={!isSqlMode} /> : <LoginPage demo={!isSqlMode} />;
}
