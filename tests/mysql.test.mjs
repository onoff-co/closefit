import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import mysql from "mysql2/promise";
import { databaseConfig } from "../server/config.mjs";
import { initializeDatabase, connectDatabase } from "../server/db/database.mjs";
import { createApp } from "../server/app.mjs";
import { verifyPassword } from "../server/passwords.mjs";
const config = {
  ...databaseConfig(),
  database: "closefit_test_" + randomUUID().replaceAll("-", ""),
};
const testPassword = "integration-passphrase-2026";
let db, server, base, adminCookie, customerCookie, customerId;
async function call(path, method = "GET", body, cookie, extra = {}) {
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(method !== "GET"
        ? { origin: base, "content-type": "application/json" }
        : {}),
      ...(cookie ? { cookie } : {}),
      ...extra,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {
    status: response.status,
    body: await response.json(),
    cookie: response.headers.get("set-cookie")?.split(";")[0],
    setCookie: response.headers.get("set-cookie"),
  };
}
before(async () => {
  db = await initializeDatabase(config, {
    username: "admin",
    password: testPassword,
  });
  server = createApp({ db });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  base = "http://127.0.0.1:" + server.address().port;
  const admin = await call("/api/auth/login", "POST", {
    username: "admin",
    password: testPassword,
  });
  assert.equal(admin.status, 200);
  adminCookie = admin.cookie;
  const customer = await call("/api/auth/register", "POST", {
    username: "customer01",
    name: "테스트 고객",
    email: "customer@example.test",
    password: testPassword,
    consent: true,
  });
  assert.equal(customer.status, 201);
  customerCookie = customer.cookie;
  customerId = customer.body.id;
});
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (db) await db.close();
  if (!/^closefit_test_[a-f0-9]{32}$/.test(config.database))
    throw Error("Unsafe test database cleanup");
  const { database, ...settings } = config,
    connection = await mysql.createConnection(settings);
  try {
    await connection.query(
      "DROP DATABASE IF EXISTS " + mysql.escapeId(database),
    );
  } finally {
    await connection.end();
  }
});
test("SQL login/register uses hashed passwords, cookies, unique identifiers and server roles", async () => {
  assert.equal(
    (await call("/api/me", "GET", undefined, adminCookie)).body.user.admin,
    true,
  );
  assert.equal(
    (await call("/api/me", "GET", undefined, customerCookie)).body.user.admin,
    false,
  );
  const stored = await db.get(
    "SELECT password_hash FROM members WHERE username=?",
    ["admin"],
  );
  assert.notEqual(stored.password_hash, testPassword);
  assert.ok(await verifyPassword(testPassword, stored.password_hash));
  const members = await call(
    "/api/admin/members",
    "GET",
    undefined,
    adminCookie,
  );
  assert.ok(!JSON.stringify(members.body).includes("password_hash"));
  assert.match(
    (
      await call("/api/auth/login", "POST", {
        username: "admin",
        password: testPassword,
      })
    ).setCookie,
    /HttpOnly; SameSite=Strict/,
  );
  assert.equal(
    (
      await call("/api/auth/login", "POST", {
        username: "admin",
        password: "wrong-password-2026",
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await call("/api/auth/register", "POST", {
        username: "customer01",
        name: "중복",
        email: "new@example.test",
        password: testPassword,
        consent: true,
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await call("/api/auth/register", "POST", {
        username: "hacker01",
        name: "오류",
        email: "other@example.test",
        password: testPassword,
        consent: true,
        role: "admin",
      })
    ).status,
    422,
  );
});
test("SQL API rejects spoofed headers, missing sessions, customer admin access and cross-origin writes", async () => {
  assert.equal((await call("/api/admin/products")).status, 401);
  assert.equal(
    (
      await call("/api/admin/products", "GET", undefined, undefined, {
        "oai-authenticated-user-id": "admin",
        "oai-authenticated-user-email": "admin@example.test",
      })
    ).status,
    401,
  );
  assert.equal(
    (await call("/api/admin/products", "GET", undefined, customerCookie))
      .status,
    403,
  );
  assert.equal(
    (
      await call(
        "/api/auth/login",
        "POST",
        { username: "admin", password: testPassword },
        undefined,
        { origin: "https://other.example" },
      )
    ).status,
    403,
  );
});
test("SQL product CRUD supports partial updates and soft deletion", async () => {
  const initial = await call("/api/products");
  assert.deepEqual(
    initial.body.products.map((p) => p.id),
    [0, 1, 2, 3, 4, 5, 6, 7, 8],
  );
  const input = {
    name: "MySQL 셔츠",
    sub: "검증용",
    price: 41000,
    stock: 5,
    category: "SHIRTS",
    tag: "NEW",
    colors: ["#aabbcc"],
    image: "/assets/hanger-shirt.png",
  };
  const created = await call("/api/admin/products", "POST", input, adminCookie);
  assert.equal(created.status, 201);
  const pid = created.body.id;
  assert.equal(
    (
      await call(
        "/api/admin/products/" + pid,
        "PATCH",
        { price: 42000 },
        adminCookie,
      )
    ).status,
    200,
  );
  assert.equal(
    (await call("/api/admin/products/" + pid, "GET", undefined, adminCookie))
      .body.product.price,
    42000,
  );
  assert.equal(
    (
      await call(
        "/api/admin/products/" + pid,
        "PATCH",
        { price: -1 },
        adminCookie,
      )
    ).status,
    422,
  );
  assert.equal(
    (await call("/api/admin/products/" + pid, "DELETE", undefined, adminCookie))
      .status,
    200,
  );
  assert.ok(
    !(await call("/api/products")).body.products.some((p) => p.id === pid),
  );
});
test("SQL checkout rolls back invalid orders, prevents duplicates and protects ownership", async () => {
  const p = (await call("/api/products")).body.products.find((p) => p.id === 8),
    items = [{ id: p.id, qty: 2, size: "L", color: p.colors[0], price: 1 }];
  assert.equal(
    (
      await call(
        "/api/orders",
        "POST",
        {
          items: [...items, { ...items[0], qty: 99 }],
          method: "card",
          paymentId: "failed-payment",
        },
        customerCookie,
      )
    ).status,
    409,
  );
  assert.equal(
    (await call("/api/products")).body.products.find((p) => p.id === 8).stock,
    50,
  );
  const payload = { items, method: "card", paymentId: "test-payment-0001" },
    order = await call("/api/orders", "POST", payload, customerCookie);
  assert.equal(order.status, 201);
  assert.equal(order.body.total, 78000);
  assert.equal(
    (await call("/api/orders", "POST", payload, customerCookie)).body.id,
    order.body.id,
  );
  assert.equal(
    (await call("/api/products")).body.products.find((p) => p.id === 8).stock,
    48,
  );
  assert.ok(
    !(
      await call("/api/orders", "GET", undefined, adminCookie)
    ).body.orders.some((o) => o.id === order.body.id),
  );
  assert.equal(
    (
      await call(
        "/api/admin/orders/" + order.body.id,
        "DELETE",
        undefined,
        adminCookie,
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await call(
        "/api/admin/orders/" + order.body.id,
        "PATCH",
        { status: "cancelled" },
        adminCookie,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await call(
        "/api/admin/orders/" + order.body.id,
        "DELETE",
        undefined,
        adminCookie,
      )
    ).status,
    200,
  );
  assert.equal(
    (await call("/api/orders", "POST", payload, customerCookie)).status,
    409,
  );
});
test("SQL locks prevent two concurrent orders from overselling a product", async () => {
  const p = (await call("/api/products")).body.products.find((p) => p.id === 8);
  await call("/api/admin/products/8", "PATCH", { stock: 1 }, adminCookie);
  const body = {
    items: [{ id: 8, qty: 1, color: p.colors[0], size: "L" }],
    method: "card",
  };
  const results = await Promise.all(
    ["concurrent-0001", "concurrent-0002"].map((paymentId) =>
      call("/api/orders", "POST", { ...body, paymentId }, customerCookie),
    ),
  );
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  assert.equal(
    (await call("/api/products")).body.products.find((p) => p.id === 8).stock,
    0,
  );
});
test("SQL member CRUD preserves order snapshots and invalidates deleted sessions", async () => {
  const created = await call(
    "/api/admin/members",
    "POST",
    {
      username: "membercrud",
      name: "생성 회원",
      email: "crud@example.test",
      password: testPassword,
    },
    adminCookie,
  );
  assert.equal(created.status, 201);
  assert.equal(
    (
      await call(
        "/api/admin/members/" + created.body.id,
        "PATCH",
        { name: "수정 회원" },
        adminCookie,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await call(
        "/api/admin/members/" + created.body.id,
        "GET",
        undefined,
        adminCookie,
      )
    ).body.member.name,
    "수정 회원",
  );
  assert.equal(
    (
      await call(
        "/api/admin/members/" + created.body.id,
        "DELETE",
        undefined,
        adminCookie,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await call(
        "/api/admin/members/" + customerId,
        "DELETE",
        undefined,
        adminCookie,
      )
    ).status,
    200,
  );
  assert.ok(
    (await call("/api/admin/orders", "GET", undefined, adminCookie)).body.orders
      .filter((o) => o.email === "customer@example.test")
      .every((o) => o.user_id === null),
  );
  assert.equal(
    (await call("/api/me", "GET", undefined, customerCookie)).body.user,
    null,
  );
  const admin = (await call("/api/me", "GET", undefined, adminCookie)).body
    .user;
  assert.equal(
    (
      await call(
        "/api/admin/members/" + admin.id,
        "DELETE",
        undefined,
        adminCookie,
      )
    ).status,
    409,
  );
});
test("SQL manual orders and data survive a new connection; logout invalidates sessions", async () => {
  const created = await call(
    "/api/admin/orders",
    "POST",
    {
      customer: "수기 고객",
      email: "manual@example.test",
      total: 12000,
      status: "paid",
      note: "검증",
    },
    adminCookie,
  );
  assert.equal(created.status, 201);
  const other = await connectDatabase(config);
  try {
    assert.equal(
      (
        await other.get("SELECT total FROM orders WHERE id=?", [
          created.body.id,
        ])
      ).total,
      12000,
    );
  } finally {
    await other.close();
  }
  await call("/api/auth/logout", "POST", undefined, adminCookie);
  assert.equal(
    (await call("/api/admin/orders", "GET", undefined, adminCookie)).status,
    401,
  );
});

test("social preview is disabled by default and reuses customer-only SQL identities when enabled", async () => {
 assert.equal((await call("/api/auth/social","POST",{provider:"kakao"})).status,404);
 const preview=createApp({db,allowSocialPreview:true});preview.listen(0,"127.0.0.1");await once(preview,"listening");
 const origin="http://127.0.0.1:"+preview.address().port;
 const social=provider=>fetch(origin+"/api/auth/social",{method:"POST",headers:{Origin:origin,"Content-Type":"application/json"},body:JSON.stringify({provider,role:"admin"})});
 try {
  assert.equal((await social("unsupported")).status,422);
  for(const provider of ["kakao","google","naver"]){
   const first=await social(provider);assert.equal(first.status,200);const cookie=first.headers.get("set-cookie").split(";")[0];
   const user=(await (await fetch(origin+"/api/me",{headers:{Cookie:cookie}})).json()).user;assert.equal(user.admin,false);
   const again=await social(provider);assert.equal(again.status,200);const secondCookie=again.headers.get("set-cookie").split(";")[0];
   const second=(await (await fetch(origin+"/api/me",{headers:{Cookie:secondCookie}})).json()).user;assert.equal(second.id,user.id);
   assert.equal((await db.get("SELECT COUNT(*) AS n FROM members WHERE id=?",[user.id])).n,1);
   assert.equal((await fetch(origin+"/api/admin/products",{headers:{Cookie:cookie}})).status,403);
  }
 } finally {await new Promise(resolve=>preview.close(resolve));}
});
