"use client";

import { useEffect, useState } from "react";
import AuthLayout from "@/components/AuthLayout";
import UpdateProfileInformationForm from "@/components/profile/UpdateProfileInformationForm";
import UpdatePasswordForm from "@/components/profile/UpdatePasswordForm";
import { authClient } from "@/lib/auth-client";

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch("/api/session");
                if (response.ok) {
                    const data = await response.json();
                    setUser(data.user);
                } else {
                    // Fallback or error handling if session API fails but client session exists?
                    // If authClient has session but API fails, likely network or server error.
                    const session = await authClient.getSession();
                    if (session?.data?.user) setUser(session.data.user);
                }
            } catch (error) {
                console.error("Error fetching user", error);
                const session = await authClient.getSession();
                if (session?.data?.user) setUser(session.data.user);
            }
            setLoading(false);
        };
        fetchUser();
    }, []);

    if (loading) {
        return (
            <AuthLayout>
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    </div>
                </div>
            </AuthLayout>
        );
    }

    if (!user) return null; // AuthLayout handles redirect

    return (
        <AuthLayout>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <UpdateProfileInformationForm user={user} />

                    <div className="hidden sm:block" aria-hidden="true">
                        <div className="py-5">
                            <div className="border-t border-gray-200" />
                        </div>
                    </div>

                    <UpdatePasswordForm />
                </div>
            </div>
        </AuthLayout>
    );
}
