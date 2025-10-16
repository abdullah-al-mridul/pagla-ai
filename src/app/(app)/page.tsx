import { EmptyScreen } from '@/components/chat/empty-screen';
import { ChatMessages } from '@/components/chat/chat-messages';
import { ChatInput } from '@/components/chat/chat-input';

export default function NewChatPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <ChatMessages messages={[]} />
        <EmptyScreen />
      </div>
      <div className="border-t bg-background p-4">
        <ChatInput />
      </div>
    </div>
  );
}
