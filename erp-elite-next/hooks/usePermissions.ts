"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { hasPermission, canArea } from "@/lib/permissions";

interface UserSession {
    user: {
        id: string;
        name: string;
        email: string;
        image?: string;
    };
    role: string | null;
    permissions: string[];
}

/**
 * Hook to get current user session with role and permissions
 */
export function useSession() {
    const [session, setSession] = useState<UserSession | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const response = await fetch("/api/session");
                if (response.ok) {
                    const data = await response.json();
                    setSession(data);
                }
            } catch (error) {
                console.error("Failed to fetch session:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSession();
    }, []);

    return { session, loading };
}

/**
 * Hook to check if user has specific permission(s)
 */
export function usePermission(required: string | string[]) {
    const { session, loading } = useSession();

    if (loading || !session) {
        return { hasPermission: false, loading };
    }

    return {
        hasPermission: hasPermission(session.permissions, required),
        loading: false
    };
}

/**
 * Hook to check if user can perform action on area
 */
export function useCanArea(action: 'view' | 'create' | 'update' | 'delete', area: string) {
    const { session, loading } = useSession();

    if (loading || !session) {
        return { canArea: false, loading };
    }

    return {
        canArea: canArea(session.permissions, action, area),
        loading: false
    };
}
