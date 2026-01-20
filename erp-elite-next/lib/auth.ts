import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins"
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "@/drizzle";

export const auth = betterAuth({
    plugins: [nextCookies(), admin()],
    // Database with Laravel users table
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: schema
    }),
    emailAndPassword: {
        enabled: true,
    },
    // Extended stateless sessions with auto-refresh
    session: {
        expiresIn: 60 * 60 * 24 * 30, // 30 days
        updateAge: 60 * 60 * 24, // Update every 24 hours
        cookieCache: {
            enabled: true,
            maxAge: 60 * 60 * 24 * 30, // 30 days cache
            strategy: "jwe", // encrypted
            refreshCache: {
                updateAge: 60 * 60 * 24 * 7 // Refresh when 7 days remain
            }
        }
    },
});

// Re-export helper functions
export { getUserWithPermissions, assignUserRole, removeUserRole } from "./auth-helpers";
