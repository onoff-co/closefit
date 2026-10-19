import { databaseConfig, adminConfig } from "../server/config.mjs";
import { initializeDatabase } from "../server/db/database.mjs";
import { createApp } from "../server/app.mjs";
const args = process.argv.slice(2);
function number(name, fallback) {
  const index = args.indexOf(name),
    value = index < 0 ? fallback : Number(args[index + 1]);
  if (!Number.isInteger(value) || value < 1 || value > 65535)
    throw Error("Invalid " + name);
  return value;
}
const port = number("--port", 5173),
  apiPort = number("--api-port", 3001);
let db, api, vite;
async function close() {
  if (vite) await vite.close();
  if (api?.listening) await new Promise((resolve) => api.close(resolve));
  if (db) await db.close();
}
try {
  db = await initializeDatabase(databaseConfig(), adminConfig());
  api = createApp({
    db,
    allowedOrigins: ["http://127.0.0.1:" + port, "http://localhost:" + port],
  });
  await new Promise((resolve, reject) => {
    api.once("error", reject);
    api.listen(apiPort, "127.0.0.1", resolve);
  });
  process.env.VITE_DATA_SOURCE = "mysql";
  process.env.CLOSEFIT_API_PORT = String(apiPort);
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { port, host: "127.0.0.1", strictPort: true },
  });
  await vite.listen();
  vite.printUrls();
  console.log("Local MySQL auth and CRUD are enabled.");
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, async () => {
      await close();
      process.exit(0);
    });
} catch (error) {
  console.error("Local startup failed:", error.code || error.message);
  await close();
  process.exitCode = 1;
}
