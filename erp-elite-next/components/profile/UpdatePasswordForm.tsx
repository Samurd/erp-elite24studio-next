"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

export default function UpdatePasswordForm() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
        // Clear specific error when user types
        if (errors[e.target.id]) {
            setErrors({ ...errors, [e.target.id]: "" });
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        if (formData.newPassword !== formData.confirmPassword) {
            setErrors({ confirmPassword: "Las contraseñas no coinciden" });
            setProcessing(false);
            return;
        }

        if (formData.newPassword.length < 8) {
            setErrors({ newPassword: "La contraseña debe tener al menos 8 caracteres" });
            setProcessing(false);
            return;
        }

        try {
            await authClient.changePassword({
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword,
                revokeOtherSessions: true,
            }, {
                onSuccess: () => {
                    toast.success("Contraseña actualizada", {
                        description: "Tu contraseña ha sido actualizada correctamente.",
                    });
                    setFormData({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                    });
                    router.refresh();
                },
                onError: (ctx) => {
                    setErrors({
                        currentPassword: ctx.error.message || "Error al actualizar la contraseña",
                        form: ctx.error.message
                    });
                    toast.error("Error", {
                        description: ctx.error.message || "No se pudo actualizar la contraseña.",
                    });
                }
            });

        } catch (error: any) {
            console.error(error);
            setErrors({ form: "Ocurrió un error inesperado." });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="md:grid md:grid-cols-3 md:gap-6 mt-10">
            <div className="md:col-span-1">
                <div className="px-4 sm:px-0">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Actualizar Contraseña</h3>
                    <p className="mt-1 text-sm text-gray-600">
                        Asegúrate de que tu cuenta esté usando una contraseña larga y aleatoria para mantenerse segura.
                    </p>
                </div>
            </div>

            <div className="mt-5 md:mt-0 md:col-span-2">
                <form onSubmit={handleUpdatePassword}>
                    <div className="shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 bg-white sm:p-6">
                            <div className="grid grid-cols-6 gap-6">

                                {/* Current Password */}
                                <div className="col-span-6 sm:col-span-4">
                                    <Label htmlFor="currentPassword">Contraseña Actual</Label>
                                    <Input
                                        id="currentPassword"
                                        type="password"
                                        value={formData.currentPassword}
                                        onChange={handleChange}
                                        className="mt-1 block w-full"
                                        required
                                    />
                                    {errors.currentPassword && <p className="mt-2 text-sm text-red-600">{errors.currentPassword}</p>}
                                </div>

                                {/* New Password */}
                                <div className="col-span-6 sm:col-span-4">
                                    <Label htmlFor="newPassword">Nueva Contraseña</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        className="mt-1 block w-full"
                                        required
                                    />
                                    {errors.newPassword && <p className="mt-2 text-sm text-red-600">{errors.newPassword}</p>}
                                </div>

                                {/* Confirm Password */}
                                <div className="col-span-6 sm:col-span-4">
                                    <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="mt-1 block w-full"
                                        required
                                    />
                                    {errors.confirmPassword && <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>}
                                </div>

                                {errors.form && (
                                    <div className="col-span-6">
                                        <p className="text-sm text-red-600">{errors.form}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                            <Button disabled={processing}>
                                {processing ? "Guardando..." : "Guardar"}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
