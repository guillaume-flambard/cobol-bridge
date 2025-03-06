import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
});

export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  balance: real("balance").default(0),
});

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id),
  amount: real("amount").notNull(),
  createdAt: text("created_at").default(() => new Date().toISOString()),
});