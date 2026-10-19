import { createServer } from "node:http";
import { HttpError, fail, text } from "./shared.mjs";
import {
  currentUser,
  requireUser,
  requireAdmin,
  startSession,
  clearSession,
  login,
  socialPreviewLogin,
} from "./auth.mjs";
import * as products from "./modules/products.mjs";
import * as members from "./modules/members.mjs";
import * as orders from "./modules/orders.mjs";
function readBody(req) {
  if (
    req.headers["content-type"]?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    fail(415, "JSON 요청이 필요합니다.");
  return new Promise((resolve, reject) => {
    let size = 0,
      tooLarge = false;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 30000) {
        if (!tooLarge) {
          tooLarge = true;
          chunks.length = 0;
          reject(new HttpError(413, "요청이 너무 큽니다."));
        }
      } else if (!tooLarge) chunks.push(chunk);
    });
    req.on("error", () =>
      reject(new HttpError(400, "요청을 읽을 수 없습니다.")),
    );
    req.on("end", () => {
      if (tooLarge) return;
      try {
        const result = JSON.parse(
          Buffer.concat(chunks).toString("utf8") || "{}",
        );
        if (!result || typeof result !== "object" || Array.isArray(result))
          throw Error();
        resolve(result);
      } catch {
        reject(new HttpError(400, "JSON 객체가 필요합니다."));
      }
    });
  });
}
export function createApp({ db, allowedOrigins = [], allowSocialPreview = false }) {
  const attempts = new Map();
  const server = createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Frame-Options", "DENY");
    try {
      const port = server.address().port,
        host = req.headers.host;
      if (!["127.0.0.1:" + port, "localhost:" + port].includes(host))
        fail(403, "허용되지 않은 호스트입니다.");
      const origin = "http://" + host,
        path = new URL(req.url, origin).pathname,
        method = req.method,
        writing = !["GET", "HEAD", "OPTIONS"].includes(method);
      if (writing && ![origin, ...allowedOrigins].includes(req.headers.origin))
        fail(403, "허용되지 않은 요청 출처입니다.");
      if (
        ["/api/auth/login", "/api/auth/register", "/api/auth/social"].includes(path) &&
        method === "POST"
      ) {
        const key = req.socket.remoteAddress,
          now = Date.now();
        for (const [ip, entry] of attempts)
          if (entry.expires < now) attempts.delete(ip);
        const entry = attempts.get(key) || { count: 0, expires: now + 900000 };
        entry.count++;
        attempts.set(key, entry);
        if (entry.count > 30)
          fail(429, "로그인 요청이 많습니다. 잠시 후 다시 시도해주세요.");
      }
      const body = writing ? await readBody(req) : {},
        user = await currentUser(db, req);
      let result,
        status = 200;
      if (path === "/api/health" && method === "GET") {
        await db.get("SELECT 1 AS ok");
        result = { ok: true, database: "mysql" };
      } else if (path === "/api/me" && method === "GET") result = { user };
      else if (path === "/api/auth/login" && method === "POST")
        result = await login(db, req, res, body);
      else if (path === "/api/auth/social" && method === "POST") {
        if (!allowSocialPreview) fail(404, "API 경로가 없습니다.");
        result = await socialPreviewLogin(db, req, res, body);
      }
      else if (path === "/api/auth/register" && method === "POST") {
        if (body.consent !== true) fail(422, "회원 정보 저장에 동의해주세요.");
        const created = await members.createMember(db, body);
        await startSession(db, req, res, created.id);
        result = { id: created.id };
        status = 201;
      } else if (path === "/api/auth/logout" && method === "POST") {
        await clearSession(db, req, res);
        result = { ok: true };
      } else if (path === "/api/profile" && method === "POST") {
        requireUser(user);
        result = await members.updateMember(db, user.id, body, user);
      } else if (path === "/api/products" && method === "GET")
        result = { products: await products.listProducts(db) };
      else if (path === "/api/orders" && method === "GET")
        result = { orders: await orders.listOrders(db, requireUser(user)) };
      else if (path === "/api/orders" && method === "POST") {
        result = await orders.checkout(db, body, requireUser(user));
        status = 201;
      } else if (path === "/api/visits" && method === "POST") {
        if (
          !/^\/[a-zA-Z0-9/_-]*$/.test(body.path) ||
          body.path.length > 150 ||
          !/^[-a-zA-Z0-9]{8,64}$/.test(body.visitor)
        )
          fail(422, "방문 기록 형식을 확인해주세요.");
        const day = new Date().toISOString().slice(0, 10);
        await db.run(
          "INSERT IGNORE INTO visits(id,visitor,path,device) VALUES (?,?,?,?)",
          [
            day + ":" + body.visitor + ":" + body.path,
            body.visitor,
            body.path,
            ["mobile", "tablet", "desktop"].includes(body.device)
              ? body.device
              : "desktop",
          ],
        );
        result = { ok: true };
      } else if (path.startsWith("/api/admin/")) {
        requireAdmin(user);
        if (path === "/api/admin/dashboard" && method === "GET") {
          const summary = await db.get(
              "SELECT COUNT(*) AS orders,COALESCE(SUM(CASE WHEN status IN ('paid','shipping','completed') THEN total ELSE 0 END),0) AS revenue,COALESCE(SUM(status='pending'),0) AS pending FROM orders",
            ),
            visits = await db.get(
              "SELECT COUNT(*) AS views,COUNT(DISTINCT visitor) AS visitors FROM visits",
            ),
            count = await db.get("SELECT COUNT(*) AS members FROM members");
          const stats = Object.fromEntries(
            Object.entries({ ...summary, ...visits, ...count }).map(
              ([key, value]) => [key, Number(value)],
            ),
          );
          result = {
            stats,
            series: await db.all(
              "SELECT DATE_FORMAT(created_at,'%Y-%m-%d') AS day,COUNT(*) AS views,COUNT(DISTINCT visitor) AS visitors FROM visits WHERE created_at>DATE_SUB(UTC_TIMESTAMP(),INTERVAL 14 DAY) GROUP BY day ORDER BY day",
            ),
          };
        } else if (path === "/api/admin/visits" && method === "GET")
          result = {
            visits: await db.all(
              "SELECT path,device,created_at FROM visits ORDER BY created_at DESC LIMIT 200",
            ),
          };
        else if (path === "/api/admin/audit" && method === "GET")
          result = {
            logs: await db.all(
              "SELECT action,target,created_at FROM audit_logs ORDER BY created_at DESC LIMIT 200",
            ),
          };
        else {
          const match = path.match(
            /^\/api\/admin\/(products|members|orders)(?:\/([^/]+))?$/,
          );
          if (!match) fail(404, "API 경로가 없습니다.");
          const [, kind, raw] = match;
          let key;
          try {
            key = raw === undefined ? undefined : decodeURIComponent(raw);
          } catch {
            fail(400, "잘못된 ID입니다.");
          }
          if (kind === "products" && key !== undefined && !/^\d+$/.test(key))
            fail(422, "잘못된 상품 ID입니다.");
          const modules = {
              products: {
                list: async () => ({
                  products: await products.listProducts(db, true),
                }),
                get: async () => ({
                  product: await products.getProduct(db, Number(key)),
                }),
                create: () => products.createProduct(db, body, user),
                update: () =>
                  products.updateProduct(db, Number(key), body, user),
                remove: () => products.deleteProduct(db, Number(key), user),
              },
              members: {
                list: async () => ({ members: await members.listMembers(db) }),
                get: async () => ({ member: await members.getMember(db, key) }),
                create: () => members.createMember(db, body, user),
                update: () => members.updateMember(db, key, body, user),
                remove: () => members.deleteMember(db, key, user),
              },
              orders: {
                list: async () => ({
                  orders: await orders.listOrders(db, user, true),
                }),
                get: async () => ({ order: await orders.getOrder(db, key) }),
                create: () => orders.createOrder(db, body, user),
                update: () => orders.updateOrder(db, key, body, user),
                remove: () => orders.deleteOrder(db, key, user),
              },
            },
            module = modules[kind];
          if (key === undefined && method === "GET")
            result = await module.list();
          else if (key === undefined && method === "POST") {
            result = await module.create();
            status = 201;
          } else if (key !== undefined && method === "GET")
            result = await module.get();
          else if (key !== undefined && method === "PATCH")
            result = await module.update();
          else if (key !== undefined && method === "DELETE")
            result = await module.remove();
          else fail(405, "지원하지 않는 메서드입니다.");
        }
      } else fail(404, "API 경로가 없습니다.");
      res.statusCode = status;
      res.end(JSON.stringify(result));
    } catch (error) {
      req.resume();
      res.statusCode =
        error instanceof HttpError
          ? error.status
          : error.code === "ER_DUP_ENTRY"
            ? 409
            : 500;
      if (res.statusCode === 500)
        console.error("MySQL API error:", error.code || error.name);
      res.end(
        JSON.stringify({
          error:
            res.statusCode === 500
              ? "요청을 처리할 수 없습니다."
              : error.code === "ER_DUP_ENTRY"
                ? "이미 사용 중인 데이터입니다."
                : error.message,
        }),
      );
    }
  });
  server.headersTimeout = 5000;
  server.requestTimeout = 10000;
  server.keepAliveTimeout = 1000;
  server.maxHeadersCount = 50;
  return server;
}
