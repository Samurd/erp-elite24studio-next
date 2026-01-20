import ChatWindow from '@/components/chat/ChatWindow';

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <div className="flex-1 h-full">
      <ChatWindow roomId={`private:${id}`} title="Chat" />
    </div>
  );
}
