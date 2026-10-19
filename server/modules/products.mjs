import { validateProduct } from "../../worker/index.mjs";
import { fail, audit } from "../shared.mjs";
const row = (p) => ({
  ...p,
  colors: typeof p.colors === "string" ? JSON.parse(p.colors) : p.colors,
  active: Number(p.active),
});
export async function listProducts(db, admin = false) {
  return (
    await db.all(
      "SELECT * FROM products" +
        (admin ? "" : " WHERE active=1") +
        " ORDER BY id",
    )
  ).map(row);
}
export async function getProduct(db, productId) {
  const product = await db.get("SELECT * FROM products WHERE id=?", [
    productId,
  ]);
  if (!product) fail(404, "상품이 없습니다.");
  return row(product);
}
function validate(body) {
  try {
    return validateProduct(body);
  } catch (error) {
    fail(422, error.message);
  }
}
export async function createProduct(db, body, user) {
  const p = validate(body);
  return db.transaction(async (tx) => {
    const result = await tx.run(
      "INSERT INTO products(name,sub,price,category,tag,colors,image,stock) VALUES (?,?,?,?,?,?,?,?)",
      [
        p.name,
        p.sub,
        p.price,
        p.category,
        p.tag,
        JSON.stringify(p.colors),
        p.image,
        p.stock,
      ],
    );
    await audit(tx, user, "product.create", result.insertId);
    return { id: result.insertId };
  });
}
export async function updateProduct(db, productId, body, user) {
  return db.transaction(async (tx) => {
    const existing = await getProduct(tx, productId),
      p = validate({ ...existing, ...body });
    if (body.active !== undefined && typeof body.active !== "boolean")
      fail(422, "판매 상태를 확인해주세요.");
    await tx.run(
      "UPDATE products SET name=?,sub=?,price=?,category=?,tag=?,colors=?,image=?,stock=?,active=? WHERE id=?",
      [
        p.name,
        p.sub,
        p.price,
        p.category,
        p.tag,
        JSON.stringify(p.colors),
        p.image,
        p.stock,
        body.active === undefined ? existing.active : body.active ? 1 : 0,
        productId,
      ],
    );
    await audit(tx, user, "product.patch", productId);
    return { ok: true };
  });
}
export async function deleteProduct(db, productId, user) {
  return db.transaction(async (tx) => {
    await getProduct(tx, productId);
    await tx.run("UPDATE products SET active=0 WHERE id=?", [productId]);
    await audit(tx, user, "product.delete", productId);
    return { ok: true };
  });
}
