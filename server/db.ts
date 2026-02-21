import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// -----------------------------
// ESM-safe __dirname
// -----------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -----------------------------
// Force-load ROOT .env
// -----------------------------
dotenv.config({
  path: path.join(__dirname, "..", ".env"),
});

// Debug (keep for now)
console.log("DB ENV CHECK → DATABASE_URL:", process.env.DATABASE_URL);

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
