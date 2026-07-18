import "server-only";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

type CanvasDatabase = BetterSQLite3Database<typeof schema>;

const globalForDatabase = globalThis as typeof globalThis & {
  creativeCanvasDb?: CanvasDatabase;
};

export function getDb(): CanvasDatabase {
  if (globalForDatabase.creativeCanvasDb) return globalForDatabase.creativeCanvasDb;

  const databasePath = path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    process.env.DATABASE_URL ?? "./data/ai-creative-canvas.db",
  );
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  const sqlite = new Database(databasePath, { timeout: 5000 });
  sqlite.pragma("busy_timeout = 5000");
  sqlite.pragma("journal_mode = WAL");
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      scene_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      path TEXT NOT NULL,
      size INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS generation_jobs (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      status TEXT NOT NULL,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      prompt TEXT NOT NULL,
      request_json TEXT NOT NULL,
      result_asset_ids_json TEXT NOT NULL DEFAULT '[]',
      progress INTEGER NOT NULL DEFAULT 0,
      error TEXT,
      retry_of_job_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS generation_jobs_created_at_idx
      ON generation_jobs(created_at DESC);
    CREATE TABLE IF NOT EXISTS video_jobs (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      prompt TEXT NOT NULL,
      request_json TEXT NOT NULL,
      remote_job_id TEXT,
      result_asset_id TEXT,
      progress INTEGER NOT NULL DEFAULT 0,
      error TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      next_poll_at TEXT,
      retry_of_job_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS video_jobs_created_at_idx
      ON video_jobs(created_at DESC);
  `);

  const database = drizzle(sqlite, { schema });
  globalForDatabase.creativeCanvasDb = database;
  return database;
}
