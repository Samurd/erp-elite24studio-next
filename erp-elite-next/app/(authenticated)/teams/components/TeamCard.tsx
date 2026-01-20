import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Hash, Globe, Lock } from 'lucide-react';

interface Team {
    id: number;
    name: string;
    description?: string;
    profile_photo_url?: string;
    isPublic: boolean;
    members_count: number;
    channels_count: number;
    members?: Array<{
        id: string;
        role_slug: string;
    }>;
}

interface TeamCardProps {
    team: Team;
}

export function TeamCard({ team }: TeamCardProps) {
    const isMember = team.members && team.members.length > 0;

    return (
        <Link href={`/teams/${team.id}`} className="block h-full cursor-pointer group">
            <Card className="h-full flex flex-col transition-all duration-200 hover:shadow-lg hover:border-primary/50 border-gray-200">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <Avatar className="h-12 w-12 rounded-lg ring-2 ring-offset-2 ring-offset-background ring-transparent group-hover:ring-primary/20 transition-all">
                        <AvatarImage src={team.profile_photo_url} alt={team.name} className="object-cover" />
                        <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">
                            {team.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
                                {team.name}
                            </CardTitle>
                            {isMember && (
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] px-2 h-5">
                                    Miembro
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={`text-[10px] px-2 h-5 gap-1 font-normal ${team.isPublic ? 'text-green-600 border-green-200 bg-green-50' : 'text-gray-500 border-gray-200 bg-gray-50'}`}>
                                {team.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                                {team.isPublic ? 'Público' : 'Privado'}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 pb-4">
                    <CardDescription className="line-clamp-3 text-sm text-muted-foreground leading-relaxed">
                        {team.description || "Sin descripción disponible para este equipo."}
                    </CardDescription>
                </CardContent>

                <CardFooter className="pt-0 pb-4 text-xs text-muted-foreground flex items-center justify-between border-t border-gray-100/50 mt-auto px-6 py-3 bg-gray-50/50">
                    <div className="flex items-center gap-1.5" title={`${team.members_count} miembros`}>
                        <Users className="h-3.5 w-3.5" />
                        <span>{team.members_count}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title={`${team.channels_count} canales`}>
                        <Hash className="h-3.5 w-3.5" />
                        <span>{team.channels_count}</span>
                    </div>
                </CardFooter>
            </Card>
        </Link>
    );
}
