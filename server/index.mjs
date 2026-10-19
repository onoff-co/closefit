import { databaseConfig } from "./config.mjs";
import { connectDatabase } from "./db/database.mjs";
import { createApp } from "./app.mjs";
const port = Number(process.env.CLOSEFIT_API_PORT || 3001);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw Error("Invalid API port");
const allowedOrigins = (
  process.env.CLOSEFIT_DEV_ORIGINS ||
  "http://127.0.0.1:5173,http://localhost:5173"
).split(",");
for (const origin of allowedOrigins) {
  const url = new URL(origin);
  if (
    !["127.0.0.1", "localhost"].includes(url.hostname) ||
    url.origin !== origin ||
    url.protocol !== "http:"
  )
    throw Error("Only local developer origins are supported");
}
try {
  const db = await connectDatabase(databaseConfig()),
    server = createApp({ db, allowedOrigins });
  server.on("error", async (error) => {
    console.error("API startup failed:", error.code);
    await db.close();
    process.exitCode = 1;
  });
  server.listen(port, "127.0.0.1", () =>
    console.log("MySQL API ready: http://127.0.0.1:" + port),
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () => {
      server.close(async () => {
        await db.close();
        process.exit(0);
      });
      server.closeIdleConnections();
    });
} catch (error) {
  console.error("MySQL API connection failed:", error.code || error.message);
  process.exitCode = 1;
}
