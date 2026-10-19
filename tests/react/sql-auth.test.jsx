import { it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { StoreProvider } from "../../src/state/StoreContext.jsx";
import * as api from "../../src/lib/api.js";
import LoginPage from "../../src/pages/auth/LoginPage.jsx";
import SignupPage from "../../src/pages/auth/SignupPage.jsx";
function mount(Component) {
  const calls = [];
  let user = null;
  vi.spyOn(api, "request").mockImplementation(async (path, method, body) => {
    calls.push([path, method, body]);
    if (path === "/api/products") return { products: [] };
    if (path === "/api/me") return { user };
    if (path === "/api/auth/login" || path === "/api/auth/register") {
      user = {
        id: "test",
        admin: false,
        email: "test@example.test",
        profile: { name: "테스트 고객" },
      };
      return { ok: true };
    }
    return { ok: true };
  });
  render(
    <MemoryRouter>
      <StoreProvider>
        <Component />
      </StoreProvider>
    </MemoryRouter>,
  );
  return calls;
}
it("local login submits credentials through the API and displays server errors", async () => {
  const calls = mount(LoginPage),
    user = userEvent.setup();
  await user.type(await screen.findByLabelText("아이디"), "customer01");
  await user.type(screen.getByLabelText("비밀번호"), "form-test-password");
  await user.click(screen.getByRole("button", { name: "로그인" }));
  await waitFor(() =>
    expect(
      calls.some(
        ([path, method, body]) =>
          path === "/api/auth/login" &&
          method === "POST" &&
          body.username === "customer01",
      ),
    ).toBe(true),
  );
});
it("local signup rejects mismatched passwords and submits valid form data", async () => {
  const calls = mount(SignupPage),
    user = userEvent.setup();
  await user.type(await screen.findByLabelText("아이디"), "customer01");
  await user.type(screen.getByLabelText("이름 / 닉네임"), "가입 고객");
  await user.type(screen.getByLabelText("이메일"), "new@example.test");
  await user.type(
    screen.getByLabelText("비밀번호", { exact: true }),
    "form-test-password",
  );
  await user.type(screen.getByLabelText("비밀번호 확인"), "different-password");
  await user.click(screen.getByRole("checkbox"));
  await user.click(screen.getByRole("button", { name: "회원가입" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "비밀번호가 일치하지 않습니다.",
  );
  expect(calls.some(([path]) => path === "/api/auth/register")).toBe(false);
  await user.clear(screen.getByLabelText("비밀번호 확인"));
  await user.type(screen.getByLabelText("비밀번호 확인"), "form-test-password");
  await user.click(screen.getByRole("button", { name: "회원가입" }));
  await waitFor(() =>
    expect(
      calls.some(
        ([path, method, body]) =>
          path === "/api/auth/register" &&
          method === "POST" &&
          body.username === "customer01" &&
          body.consent === true,
      ),
    ).toBe(true),
  );
});

it("keeps local social buttons from bypassing MySQL authentication", async () => {
  const calls = mount(LoginPage), user = userEvent.setup();
  for (const name of ["카카오", "구글", "네이버"]) {
    await user.click(await screen.findByRole("button", {name: name + "로 로그인"}));
    expect(await screen.findByRole("status")).toHaveTextContent(name + " 로그인은 준비 중입니다.");
  }
  expect(calls.some(([path]) => path === "/api/auth/social" || path === "/api/auth/login")).toBe(false);
});
