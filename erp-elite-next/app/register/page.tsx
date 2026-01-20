"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            setLoading(false);
            return;
        }

        await authClient.signUp.email({
            email,
            password,
            name,
        }, {
            onSuccess: () => {
                router.push("/");
            },
            onError: (ctx) => {
                setError(ctx.error.message);
                setLoading(false);
            }
        });
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    return (
        <div className="min-h-screen bg-gradient-to-r from-black via-yellow-600 to-yellow-400 flex flex-col sm:justify-center items-center pt-6 sm:pt-0">

            <div className="w-full sm:max-w-md mt-6 px-6 py-4 bg-black/30 backdrop-blur-md shadow-md overflow-hidden sm:rounded-lg">
                <div>
                    <h3 className="text-white font-semibold text-2xl text-center mb-4">Registrarse</h3>

                    {error && (
                        <div className="mb-4 font-medium text-sm text-red-400 text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={submit} className="w-full p-4">
                        <div>
                            <label htmlFor="name" className="block font-medium text-sm text-white">
                                Nombre Completo
                            </label>
                            <div className="bg-gray-500/20 rounded-md mt-1">
                                <input
                                    id="name"
                                    type="text"
                                    className="block mt-1 w-full p-2 rounded-md focus:ring-2 focus:ring-yellow-500 bg-transparent backdrop-blur-sm text-white placeholder-gray-400 border-none outline-none"
                                    placeholder="Nombre Completo"
                                    required
                                    autoFocus
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <label htmlFor="email" className="block font-medium text-sm text-white">
                                Correo Electrónico
                            </label>
                            <div className="bg-gray-500/20 rounded-md mt-1">
                                <input
                                    id="email"
                                    type="email"
                                    className="block mt-1 w-full p-2 rounded-md focus:ring-2 focus:ring-yellow-500 bg-transparent backdrop-blur-sm text-white placeholder-gray-400 border-none outline-none"
                                    placeholder="Correo Electrónico"
                                    required
                                    autoComplete="username"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <label htmlFor="password" className="block font-medium text-sm text-white">
                                Contraseña
                            </label>
                            <div className="bg-gray-500/20 rounded-md relative mt-1">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    className="block mt-1 w-full p-2 rounded-md focus:ring-2 focus:ring-yellow-500 bg-transparent backdrop-blur-sm text-white placeholder-gray-400 border-none outline-none"
                                    placeholder="Contraseña"
                                    required
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                    onClick={togglePasswordVisibility}
                                >
                                    {!showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label htmlFor="confirmPassword" className="block font-medium text-sm text-white">
                                Confirmar Contraseña
                            </label>
                            <div className="bg-gray-500/20 rounded-md relative mt-1">
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    className="block mt-1 w-full p-2 rounded-md focus:ring-2 focus:ring-yellow-500 bg-transparent backdrop-blur-sm text-white placeholder-gray-400 border-none outline-none"
                                    placeholder="Confirmar Contraseña"
                                    required
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                    onClick={toggleConfirmPasswordVisibility}
                                >
                                    {!showConfirmPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center mt-4">
                            <Link
                                href="/login"
                                className="underline text-sm text-gray-300 hover:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                            >
                                ¿Ya tienes cuenta? Inicia sesión
                            </Link>

                            <button
                                type="submit"
                                className="w-full bg-black hover:bg-gray-900 text-white font-semibold py-3 transition mt-4 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                                disabled={loading}
                            >
                                {!loading ? (
                                    <span>Registrarse</span>
                                ) : (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Procesando...
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
