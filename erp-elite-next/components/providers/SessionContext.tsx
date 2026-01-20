"use client";

import { createContext, useContext } from "react";

export interface UserSession {
    user: {
        id: string; // Add id
        name: string;
        email: string;
        image?: string;
        emailVerified?: boolean;
    } | null;
    role: string;
    permissions: Record<string, boolean>;
    refreshSession: () => Promise<void>;
    loading: boolean;
}

const SessionContext = createContext<UserSession | undefined>(undefined);

export function useSession() {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error("useSession must be used within a SessionProvider");
    }
    return context;
}

export const SessionProvider = SessionContext.Provider;
