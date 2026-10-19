import { databaseConfig, adminConfig } from "../server/config.mjs";
import { initializeDatabase } from "../server/db/database.mjs";
try {
  const db = await initializeDatabase(databaseConfig(), adminConfig());
  await db.close();
  console.log("MySQL schema, initial products and administrator are ready.");
} catch (error) {
  console.error("MySQL setup failed:", error.code || error.message);
  process.exitCode = 1;
}
