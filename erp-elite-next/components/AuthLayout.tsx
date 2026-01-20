"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { SessionProvider, UserSession } from "@/components/providers/SessionContext";

interface AuthLayoutProps {
    children: React.ReactNode;
}

interface ApiSessionData {
    user: any;
    role: string | null;
    roleName: string | null;
    permissions: string[];
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [userRole, setUserRole] = useState<string>("Usuario");
    const [permissions, setPermissions] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);

    const checkSession = useCallback(async () => {
        console.log("AuthLayout: checkSession running");
        try {
            const session = await authClient.getSession();

            if (!session?.data?.user) {
                console.log("AuthLayout: No session, redirecting");
                router.push("/login");
                return;
            }

            // Fetch user role from session API
            const response = await fetch("/api/session", { cache: "no-store" });
            if (response.ok) {
                const sessionData: ApiSessionData = await response.json();
                console.log("AuthLayout: Fetched user image:", sessionData.user.image);
                setUser(sessionData.user); // Use fresh user data from DB
                setUserRole(sessionData.roleName || "Usuario");

                // Convert array of permission strings to object for easier updating
                const permsMap: Record<string, boolean> = {};
                if (Array.isArray(sessionData.permissions)) {
                    sessionData.permissions.forEach(p => {
                        permsMap[p] = true;
                        // Also enable the base module permission if it's a dot notation (e.g. "finanzas.view" -> "finanzas")
                        if (p.includes('.')) {
                            const moduleName = p.split('.')[0];
                            permsMap[moduleName] = true;
                        }
                    });
                }
                setPermissions(permsMap);
            }
        } catch (error) {
            console.error("Error fetching session data:", error);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        console.log("AuthLayout: Mounted");
        checkSession();
        return () => console.log("AuthLayout: Unmounted");
    }, [checkSession]);

    const refreshSession = async () => {
        console.log("AuthLayout: refreshing session...");
        await checkSession();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const sessionContextValue: UserSession = {
        user,
        role: userRole,
        permissions,
        refreshSession,
        loading
    };

    return (
        <SessionProvider value={sessionContextValue}>
            <div className="min-h-screen bg-gray-50 flex">
                <Sidebar permissions={permissions} />
                <div className="flex-1 ml-[280px]"> {/* Offset for fixed sidebar */}
                    <Navbar user={user} userRole={userRole} permissions={permissions} />
                    <main className="pt-16 p-6">
                        {children}
                    </main>
                </div>
            </div>
        </SessionProvider>
    );
}
