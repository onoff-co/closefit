CREATE TABLE members (id TEXT PRIMARY KEY NOT NULL, email TEXT NOT NULL, name TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL);
--> statement-breakpoint
CREATE TABLE products (id INTEGER PRIMARY KEY NOT NULL, name TEXT NOT NULL, sub TEXT NOT NULL, price INTEGER NOT NULL, category TEXT NOT NULL, tag TEXT NOT NULL, colors TEXT NOT NULL, image TEXT NOT NULL, stock INTEGER DEFAULT 50 NOT NULL, active INTEGER DEFAULT 1 NOT NULL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL);
--> statement-breakpoint
CREATE TABLE orders (id TEXT PRIMARY KEY NOT NULL, user_id TEXT, customer TEXT NOT NULL, email TEXT NOT NULL, items TEXT NOT NULL, total INTEGER NOT NULL, status TEXT DEFAULT 'pending' NOT NULL, note TEXT DEFAULT '' NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL, FOREIGN KEY(user_id) REFERENCES members(id) ON DELETE SET NULL);
--> statement-breakpoint
CREATE TABLE visits (id TEXT PRIMARY KEY NOT NULL, visitor TEXT NOT NULL, path TEXT NOT NULL, device TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL);
--> statement-breakpoint
CREATE TABLE audit_logs (id TEXT PRIMARY KEY NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL, target TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL);
--> statement-breakpoint
CREATE INDEX orders_date_idx ON orders(created_at);
--> statement-breakpoint
CREATE INDEX visits_date_idx ON visits(created_at);
--> statement-breakpoint
CREATE INDEX orders_user_idx ON orders(user_id);
