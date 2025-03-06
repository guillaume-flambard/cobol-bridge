import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./schema.js",
  dialect: "sqlite",
  dbCredentials: {
    url: "cobol_bridge.db",
  },
  verbose: true,
  strict: true,
});
