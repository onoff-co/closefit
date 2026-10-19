import mysql from "mysql2/promise";
import fs from "node:fs/promises";
import { initialProducts } from "../../worker/catalog.mjs";
import { hashPassword } from "../passwords.mjs";
import { id, username, password } from "../shared.mjs";
function executor(connection) {
  return {
    async all(sql, args = []) {
      const [rows] = await connection.execute(sql, args);
      return rows;
    },
    async get(sql, args = []) {
      const [rows] = await connection.execute(sql, args);
      return rows[0] || null;
    },
    async run(sql, args = []) {
      const [result] = await connection.execute(sql, args);
      return result;
    },
  };
}
export async function connectDatabase(config) {
  const pool = mysql.createPool({
    ...config,
    dateStrings: true,
    timezone: "Z",
    connectionLimit: 6,
    charset: "utf8mb4",
    multipleStatements: false,
  });
  pool.on("connection", (connection) =>
    connection.query("SET time_zone = '+00:00'"),
  );
  try {
    await pool.execute("SELECT 1");
  } catch (error) {
    await pool.end();
    throw error;
  }
  const db = {
    ...executor(pool),
    pool,
    close: () => pool.end(),
    async transaction(fn) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const result = await fn(executor(connection));
        await connection.commit();
        return result;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    },
  };
  return db;
}
export async function initializeDatabase(config, admin) {
  if (!/^[a-zA-Z0-9_]{1,64}$/.test(config.database))
    throw Error("Invalid DB_NAME");
  const { database, ...credentials } = config,
    connection = await mysql.createConnection(credentials);
  try {
    await connection.query(
      "CREATE DATABASE IF NOT EXISTS " +
        mysql.escapeId(database) +
        " CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci",
    );
  } finally {
    await connection.end();
  }
  const db = await connectDatabase(config);
  try {
    const schema = await fs.readFile(
      new URL("./schema.sql", import.meta.url),
      "utf8",
    );
    for (const statement of schema
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean))
      await db.run(statement);
    await db.transaction(async (tx) => {
      await tx.run(
        "SET SESSION sql_mode=CONCAT_WS(',',@@sql_mode,'NO_AUTO_VALUE_ON_ZERO')",
      );
      for (const p of initialProducts)
        await tx.run(
          "INSERT IGNORE INTO products(id,name,sub,price,category,tag,colors,image,stock) VALUES (?,?,?,?,?,?,?,?,?)",
          [
            p.id,
            p.name,
            p.sub,
            p.price,
            p.category,
            p.tag,
            JSON.stringify(p.colors),
            p.id === 8
              ? "/assets/hanger-shirt.png"
              : "/assets/hanger-catalog.png",
            50,
          ],
        );
    });
    const login = username(admin.username),
      existing = await db.get("SELECT id,role FROM members WHERE username=?", [
        login,
      ]);
    if (existing && existing.role !== "admin")
      throw Error(
        "ADMIN_USERNAME belongs to a customer; choose another admin account",
      );
    if (!existing) {
      password(admin.password);
      const hash = await hashPassword(admin.password);
      await db.run(
        "INSERT INTO members(id,username,email,name,password_hash,role) VALUES (?,?,?,?,?,'admin')",
        [id(), login, login + "@closefit.local", "관리자", hash],
      );
    }
    return db;
  } catch (error) {
    await db.close();
    throw error;
  }
}
