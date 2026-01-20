import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Users, Camera, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function CreateTeamModal() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isPublic: true,
        photo_url: ''
    });

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const data = new FormData();
        data.append('file', file);

        try {
            const res = await fetch('/api/teams/upload-photo', {
                method: 'POST',
                body: data
            });
            const json = await res.json();
            if (json.success) {
                setFormData(prev => ({ ...prev, photo_url: json.url }));
                toast.success('Foto subida');
            } else {
                toast.error('Error al subir foto');
            }
        } catch (error) {
            toast.error('Error al subir foto');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        // ... (existing submit logic, formData already has photo_url)
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to create team');

            const newTeam = await response.json();

            toast.success('Equipo creado correctamente');
            setOpen(false);
            setFormData({ name: '', description: '', isPublic: true, photo_url: '' });

            // Invalidate query
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            router.push(`/teams/${newTeam.id}`);

        } catch (error) {
            console.error(error);
            toast.error('Error al crear el equipo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 shadow-sm">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Nuevo Equipo</span>
                    <span className="sm:hidden">Nuevo</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    {/* ... */}
                    <DialogTitle className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Users className="h-5 w-5 text-primary" />
                        </div>
                        Crear Nuevo Equipo
                    </DialogTitle>
                    <DialogDescription>
                        Crea un espacio de trabajo para colaborar con tu grupo.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    {/* AVATAR UPLOAD */}
                    <div className="flex justify-center mb-4">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <Avatar className="h-24 w-24 border-2 border-dashed border-gray-300 group-hover:border-primary transition-colors">
                                <AvatarImage src={formData.photo_url || undefined} className="object-cover" />
                                <AvatarFallback className="bg-gray-50 text-gray-400">
                                    {uploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Camera className="h-8 w-8" />}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 rounded-full transition-opacity text-xs font-medium">
                                Cambiar
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre del Equipo</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej: Desarrollo, Marketing..."
                            required
                            className="focus-visible:ring-primary"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Breve descripción del propósito del equipo"
                            rows={3}
                            className="resize-none focus-visible:ring-primary"
                        />
                    </div>
                    {/* ... rest of form */}

                    <div className="flex items-center space-x-2 pt-2 p-3 border rounded-lg bg-gray-50/50">
                        <Checkbox
                            id="isPublic"
                            checked={formData.isPublic}
                            onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked as boolean })}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label
                                htmlFor="isPublic"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                Equipo Público
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Cualquier miembro de la organización podrá ver y unirse a este equipo.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 gap-3">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creando...' : 'Crear Equipo'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
