"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getStorageUrl } from "@/lib/storage-client";
import { useSession } from "@/components/providers/SessionContext";

interface User {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    emailVerified?: boolean;
}

interface Props {
    user: User;
}

export default function UpdateProfileInformationForm({ user: initialUser }: Props) {
    const router = useRouter();
    const { user: sessionUser, refreshSession } = useSession();

    // Prefer session user if available (it should be), fallback to initial
    const user = sessionUser || initialUser;

    // Check if user is actually available before rendering to avoid errors if session is loading/null
    if (!user) return null;
    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
    });
    const [processing, setProcessing] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Photo management
    const photoInput = useRef<HTMLInputElement>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [imageProcessing, setImageProcessing] = useState(false);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setMessage(null);
        setErrors({});

        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.errors) {
                    setErrors(data.errors);
                } else {
                    throw new Error(data.error || "Error updating profile");
                }
            } else {
                setMessage("Guardado.");
                await refreshSession();
                router.refresh();
            }
        } catch (error: any) {
            console.error(error);
            setMessage("Ocurrió un error al actualizar el perfil.");
        } finally {
            setProcessing(false);
        }
    };

    const selectNewPhoto = () => {
        photoInput.current?.click();
    };

    const updatePhotoPreview = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Set local preview immediately
        const reader = new FileReader();
        reader.onload = (e) => {
            setPhotoPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        setImageProcessing(true);
        const data = new FormData();
        data.append("photo", file);

        try {
            const res = await fetch("/api/profile/photo", {
                method: "POST",
                body: data,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to upload photo");
            }

            // Update session data via context to reflect new image
            await refreshSession();

            const result = await res.json();
            // Update UI/router to reflect new image from server
            router.refresh();
            // Clear preview to show the new real URL (optional, or keep preview until refresh)
            setPhotoPreview(null);
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Error uploading photo");
            setPhotoPreview(null);
        } finally {
            setImageProcessing(false);
        }
    };

    const deletePhoto = async () => {
        if (!confirm("¿Estás seguro de que quieres eliminar tu foto de perfil?")) return;

        setImageProcessing(true);
        try {
            const res = await fetch("/api/profile/photo", {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete photo");

            // Update session data via context
            await refreshSession();

            setPhotoPreview(null);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Error deleting photo");
        } finally {
            setImageProcessing(false);
        }
    };

    return (
        <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
                <div className="px-4 sm:px-0">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Información del Perfil</h3>
                    <p className="mt-1 text-sm text-gray-600">
                        Actualiza la información de tu perfil y dirección de correo electrónico.
                    </p>
                </div>
            </div>

            <div className="mt-5 md:mt-0 md:col-span-2">
                <form onSubmit={handleUpdateProfile}>
                    <div className="shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 bg-white sm:p-6">
                            <div className="grid grid-cols-6 gap-6">
                                {/* Profile Photo */}
                                <div className="col-span-6 sm:col-span-4">
                                    <input
                                        type="file"
                                        className="hidden"
                                        ref={photoInput}
                                        onChange={updatePhotoPreview}
                                        accept="image/*"
                                    />

                                    <Label>Foto</Label>

                                    <div className="mt-2 flex items-center gap-4">
                                        {/* Current Profile Photo */}
                                        {!photoPreview && user.image && (
                                            <div className="mt-2">
                                                <img
                                                    src={getStorageUrl(user.image)}
                                                    alt={user.name}
                                                    className="rounded-full h-20 w-20 object-cover"
                                                />
                                            </div>
                                        )}

                                        {/* Fallback / No Photo */}
                                        {!photoPreview && !user.image && (
                                            <div className="mt-2 rounded-full h-20 w-20 bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xl">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}

                                        {/* New Profile Photo Preview */}
                                        {photoPreview && (
                                            <div className="mt-2">
                                                <span
                                                    className="block rounded-full w-20 h-20 bg-cover bg-no-repeat bg-center"
                                                    style={{ backgroundImage: `url('${photoPreview}')` }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={selectNewPhoto}
                                            disabled={imageProcessing}
                                        >
                                            Seleccionar nueva foto
                                        </Button>

                                        {user.image && (
                                            <Button
                                                type="button"
                                                variant="destructive" // Using destructive variant if available or outline with red text styles
                                                className="bg-white text-red-600 border-gray-300 hover:bg-gray-50 hover:text-red-700"
                                                onClick={deletePhoto}
                                                disabled={imageProcessing}
                                            >
                                                Eliminar foto
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Name */}
                                <div className="col-span-6 sm:col-span-4">
                                    <Label htmlFor="name">Nombre</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="mt-1 block w-full"
                                        required
                                    />
                                    {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
                                </div>

                                {/* Email */}
                                <div className="col-span-6 sm:col-span-4">
                                    <Label htmlFor="email">Correo Electrónico</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="mt-1 block w-full"
                                        required
                                    />
                                    {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 flex items-center justify-end">
                            {message && (
                                <div className="mr-3 text-sm text-gray-600">
                                    {message}
                                </div>
                            )}

                            <Button disabled={processing || imageProcessing}>
                                {processing ? "Guardando..." : "Guardar"}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
