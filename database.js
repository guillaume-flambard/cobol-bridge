import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";

const db = new Database("cobol_bridge.db");
export const database = drizzle(db);