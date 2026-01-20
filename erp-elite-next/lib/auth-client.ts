
import { createAuthClient } from "better-auth/react"

const AUTH_URL = process.env.BETTER_AUTH_URL!;
export const authClient = createAuthClient({
    baseURL: AUTH_URL // the base url of your auth server
})
