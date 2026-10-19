import { fail, text, email, integer, audit, id } from "../shared.mjs";
const statusValid = (value) =>
  ["pending", "paid", "shipping", "completed", "cancelled"].includes(value);
async function expand(db, row) {
  return {
    ...row,
    total: Number(row.total),
    items: await db.all(
      "SELECT product_id AS id,name,price,qty,color,size FROM order_items WHERE order_id=? ORDER BY id",
      [row.id],
    ),
  };
}
export async function listOrders(db, user, admin = false) {
  const rows = await db.all(
    "SELECT * FROM orders" +
      (admin ? "" : " WHERE user_id=?") +
      " ORDER BY created_at DESC,id DESC LIMIT 200",
    admin ? [] : [user.id],
  );
  return Promise.all(rows.map((row) => expand(db, row)));
}
export async function getOrder(db, orderId) {
  const row = await db.get("SELECT * FROM orders WHERE id=?", [orderId]);
  if (!row) fail(404, "주문이 없습니다.");
  return expand(db, row);
}
export async function checkout(db, body, user) {
  const paymentKey = text(body.paymentId, 100, true);
  if (paymentKey.length < 8) fail(422, "결제 식별자를 확인해주세요.");
  if (
    !["card", "transfer"].includes(body.method) ||
    !Array.isArray(body.items) ||
    !body.items.length ||
    body.items.length > 20
  )
    fail(422, "결제 정보를 확인해주세요.");
  return db.transaction(async (tx) => {
    if (
      !(await tx.get("SELECT id FROM members WHERE id=? FOR UPDATE", [user.id]))
    )
      fail(401, "다시 로그인해주세요.");
    const previous = await tx.get(
      "SELECT order_id FROM payment_keys WHERE user_id=? AND payment_key=?",
      [user.id, paymentKey],
    );
    if (previous) {
      if (!previous.order_id) fail(409, "이미 처리된 결제입니다.");
      return getOrder(tx, previous.order_id);
    }
    const counts = new Map();
    for (const x of body.items) {
      if (!x || typeof x !== "object" || Array.isArray(x))
        fail(422, "상품 정보를 확인해주세요.");
      integer(x.id, 0, 2147483647);
      integer(x.qty, 1, 99);
      counts.set(x.id, (counts.get(x.id) || 0) + x.qty);
    }
    const selected = new Map();
    for (const productId of [...counts.keys()].sort((a, b) => a - b)) {
      const p = await tx.get(
        "SELECT * FROM products WHERE id=? AND active=1 FOR UPDATE",
        [productId],
      );
      if (!p) fail(409, "판매 중인 상품이 아닙니다.");
      if (counts.get(productId) > p.stock) fail(409, "상품 재고가 부족합니다.");
      selected.set(productId, p);
    }
    const items = body.items.map((x) => {
      const p = selected.get(x.id),
        colors = typeof p.colors === "string" ? JSON.parse(p.colors) : p.colors;
      if (!["M", "L", "XL"].includes(x.size) || !colors.includes(x.color))
        fail(422, "상품 옵션을 확인해주세요.");
      return {
        id: p.id,
        name: p.name,
        price: p.price,
        qty: x.qty,
        color: x.color,
        size: x.size,
      };
    });
    const total = integer(
        items.reduce((sum, x) => sum + x.price * x.qty, 0),
        0,
        100000000,
      ),
      orderId = id();
    await tx.run(
      "INSERT INTO orders(id,user_id,customer,email,total,status,note) VALUES (?,?,?,?,?,'paid',?)",
      [
        orderId,
        user.id,
        user.profile.name,
        user.email,
        total,
        "포트폴리오 가상 결제",
      ],
    );
    for (const x of items)
      await tx.run(
        "INSERT INTO order_items(order_id,product_id,name,price,qty,color,size) VALUES (?,?,?,?,?,?,?)",
        [orderId, x.id, x.name, x.price, x.qty, x.color, x.size],
      );
    for (const [productId, qty] of counts)
      await tx.run("UPDATE products SET stock=stock-? WHERE id=?", [
        qty,
        productId,
      ]);
    await tx.run(
      "INSERT INTO payment_keys(user_id,payment_key,order_id) VALUES (?,?,?)",
      [user.id, paymentKey, orderId],
    );
    await audit(tx, user, "order.checkout", orderId);
    return getOrder(tx, orderId);
  });
}
export async function createOrder(db, body, user) {
  const customer = text(body.customer, 40, true),
    address = email(body.email),
    total = integer(body.total, 0, 100000000),
    note = text(body.note ?? "", 500);
  if (!statusValid(body.status)) fail(422, "주문 상태를 확인해주세요.");
  return db.transaction(async (tx) => {
    const orderId = id();
    await tx.run(
      "INSERT INTO orders(id,customer,email,total,status,note) VALUES (?,?,?,?,?,?)",
      [orderId, customer, address, total, body.status, note],
    );
    await audit(tx, user, "order.create", orderId);
    return { id: orderId };
  });
}
export async function updateOrder(db, orderId, body, user) {
  return db.transaction(async (tx) => {
    const previous = await getOrder(tx, orderId),
      status = body.status ?? previous.status,
      note = text(body.note ?? previous.note, 500);
    if (!statusValid(status)) fail(422, "주문 상태를 확인해주세요.");
    await tx.run("UPDATE orders SET status=?,note=? WHERE id=?", [
      status,
      note,
      orderId,
    ]);
    await audit(tx, user, "order.patch", orderId);
    return { ok: true };
  });
}
export async function deleteOrder(db, orderId, user) {
  return db.transaction(async (tx) => {
    const row = await tx.get(
      "SELECT status FROM orders WHERE id=? FOR UPDATE",
      [orderId],
    );
    if (!row) fail(404, "주문이 없습니다.");
    if (row.status !== "cancelled")
      fail(409, "취소 주문만 삭제할 수 있습니다.");
    await tx.run("DELETE FROM orders WHERE id=?", [orderId]);
    await audit(tx, user, "order.delete", orderId);
    return { ok: true };
  });
}
