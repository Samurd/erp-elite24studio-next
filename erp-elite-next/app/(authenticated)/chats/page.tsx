import { MessageSquare } from 'lucide-react';

export default function ChatsPage() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-lg font-semibold">Selecciona un chat</h3>
            <p className="text-sm">Elige una conversación de la izquierda para comenzar.</p>
        </div>
    );
}
