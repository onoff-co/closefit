import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
const local = fileURLToPath(new URL("../.env.local", import.meta.url));
if (existsSync(local)) process.loadEnvFile(local);
export function databaseConfig() {
  const database = process.env.DB_NAME || "closefit_local";
  if (!/^[a-zA-Z0-9_]{1,64}$/.test(database))
    throw Error("DB_NAME must be a SQL identifier");
  return {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database,
  };
}
export function adminConfig() {
  return {
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD,
  };
}
