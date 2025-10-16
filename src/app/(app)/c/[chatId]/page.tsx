'use client';

import { ChatInput } from '@/components/chat/chat-input';
import { ChatMessages } from '@/components/chat/chat-messages';
import { useUser, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, orderBy, query, where } from 'firebase/firestore';
import { Message, Role } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ChatPage() {
  const params = useParams<{ chatId: string }>();
  const { user } = useUser();
  const firestore = useFirestore();
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);

  const messagesQuery = useMemoFirebase(
    () =>
      user && !user.isAnonymous && params?.chatId
        ? query(
            collection(firestore, 'users', user.uid, 'chat_messages'),
            where('chatId', '==', params.chatId),
            orderBy('timestamp', 'asc')
          )
        : null,
    [firestore, user, params?.chatId]
  );
  
  const { data: firestoreMessages, isLoading } = useCollection<Message>(messagesQuery);

  useEffect(() => {
    if (user?.isAnonymous && params?.chatId) {
      const storedChats = JSON.parse(localStorage.getItem('guest_chats') || '{}');
      setOptimisticMessages(storedChats[params.chatId] || []);
    } else if (firestoreMessages) {
      setOptimisticMessages(firestoreMessages);
    }
  }, [user, params?.chatId, firestoreMessages]);

  const handleOptimisticUpdate = (userMessage: Message, aiResponsePromise: Promise<{ aiMessage?: Message | null, error?: string }>) => {
    const loadingMessage: Message = {
      id: 'ai-loading',
      role: Role.MODEL,
      content: 'loading',
      timestamp: new Date().toISOString(),
    };
    setOptimisticMessages(prev => [...prev, userMessage, loadingMessage]);

    aiResponsePromise.then(result => {
      if (result.aiMessage) {
        setOptimisticMessages(prev => {
          // Replace the loading message with the actual AI response
          const newMessages = prev.filter(msg => msg.id !== 'ai-loading');
          return [...newMessages, result.aiMessage!];
        });
      } else {
         // If AI response fails, remove loading indicator
        setOptimisticMessages(prev => prev.filter(msg => msg.id !== 'ai-loading'));
      }
    });
  };

  if (isLoading && !user?.isAnonymous) {
      return (
          <div className="flex h-full flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <ChatMessages messages={optimisticMessages} />
      </div>
      <div className="border-t bg-background p-4">
        <ChatInput chatId={params.chatId} onOptimisticUpdate={handleOptimisticUpdate} />
      </div>
    </div>
  );
}
