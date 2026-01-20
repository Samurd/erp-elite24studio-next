"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BellPlus, MessageCircle, Users, Search } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { GlobalSearch } from "@/components/GlobalSearch";

interface NavbarProps {
    user: {
        id: string; // Add id
        name: string;
        email: string;
        image?: string;
    };
    userRole?: string;
    permissions: Record<string, boolean>;
}

export default function Navbar({ user, userRole = "Usuario", permissions }: NavbarProps) {
    const router = useRouter();
    const [showingProfileDropdown, setShowingProfileDropdown] = useState(false);

    const handleLogout = async () => {
        await authClient.signOut();
        router.push("/login");
    };

    const getUserInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
    };

    return (
        <header className="h-16 bg-white p-4 flex items-center justify-between z-20 shadow-sm fixed top-0 left-[280px] right-0">
            {/* Search Bar */}
            <div className="w-2/3 relative ml-5">
                <GlobalSearch permissions={permissions} />
            </div>

            {/* Icons and Avatar */}
            <div className="flex items-center space-x-6 relative mr-5">

                {/* Private Chats */}
                <Link
                    href="/chats"
                    className="cursor-pointer text-gray-500 hover:text-gray-700"
                >
                    <MessageCircle size={25} strokeWidth={2} />
                </Link>

                {/* Teams */}
                <Link
                    href="/teams"
                    className="cursor-pointer text-gray-500 hover:text-gray-700"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        fill="currentColor"
                        className="bi bi-microsoft-teams text-black"
                        viewBox="0 0 16 16"
                    >
                        <path d="M9.186 4.797a2.42 2.42 0 1 0-2.86-2.448h1.178c.929 0 1.682.753 1.682 1.682zm-4.295 7.738h2.613c.929 0 1.682-.753 1.682-1.682V5.58h2.783a.7.7 0 0 1 .682.716v4.294a4.197 4.197 0 0 1-4.093 4.293c-1.618-.04-3-.99-3.667-2.35Zm10.737-9.372a1.674 1.674 0 1 1-3.349 0 1.674 1.674 0 0 1 3.349 0m-2.238 9.488-.12-.002a5.2 5.2 0 0 0 .381-2.07V6.306a1.7 1.7 0 0 0-.15-.725h1.792c.39 0 .707.317.707.707v3.765a2.6 2.6 0 0 1-2.598 2.598z" />
                        <path d="M.682 3.349h6.822c.377 0 .682.305.682.682v6.822a.68.68 0 0 1-.682.682H.682A.68.68 0 0 1 0 10.853V4.03c0-.377.305-.682.682-.682Zm5.206 2.596v-.72h-3.59v.72h1.357V9.66h.87V5.945z" />
                    </svg>
                </Link>

                {/* Users */}
                {permissions.usuarios && (
                    <Link
                        href="/users"
                        className="cursor-pointer text-gray-500 hover:text-gray-700"
                    >
                        <Users size={25} strokeWidth={2} />
                    </Link>
                )}


                {/* Notifications Create */}
                <NotificationDropdown userId={user.id} />

                {/* User Information */}
                <div className="flex flex-col justify-center text-right hidden md:flex">
                    <span className="text-sm font-medium text-gray-700">{user.name}</span>
                    <div className="bg-gradient-to-r from-black via-yellow-600 to-yellow-400 w-full flex items-center justify-center rounded-lg text-white text-xs font-semibold px-2 py-0.5">
                        <span>{userRole}</span>
                    </div>
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                    <div
                        onClick={() => setShowingProfileDropdown(!showingProfileDropdown)}
                        className="cursor-pointer"
                    >
                        {user.image ? (
                            <img
                                src={user.image}
                                alt={user.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-transparent hover:border-gray-300 transition"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold border-2 border-transparent hover:border-gray-300 transition">
                                {getUserInitials(user.name)}
                            </div>
                        )}
                    </div>

                    {/* Dropdown Content */}
                    {showingProfileDropdown && (
                        <>
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5">
                                <div className="block px-4 py-2 text-xs text-gray-400">
                                    Administrar Cuenta
                                </div>

                                <Link
                                    href="/profile"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    onClick={() => setShowingProfileDropdown(false)}
                                >
                                    <i className="fas fa-user-circle mr-3 text-gray-500"></i> Perfil
                                </Link>

                                <div className="border-t border-gray-100"></div>

                                <button
                                    onClick={handleLogout}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                >
                                    <i className="fas fa-sign-out-alt mr-3 text-gray-500"></i> Cerrar
                                    sesión
                                </button>
                            </div>
                            {/* Backdrop */}
                            <div
                                onClick={() => setShowingProfileDropdown(false)}
                                className="fixed inset-0 z-40"
                            ></div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
