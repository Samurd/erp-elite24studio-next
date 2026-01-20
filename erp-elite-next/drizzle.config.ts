import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: ["./drizzle/schema.ts", "./drizzle/relations.ts"],
    out: "./drizzle/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
    migrations: {
        table: "drizzle_migrations",
        schema: "public",
    },
});
