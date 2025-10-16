'use client';

import { sendMessage } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { SendHorizonal, Loader2 } from 'lucide-react';
import { useRef, useState, useTransition } from 'react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Message, Role } from '@/lib/types';

interface ChatInputProps {
  chatId?: string;
  onOptimisticUpdate?: (userMessage: Message, aiResponsePromise: Promise<{ aiMessage?: Message | null, error?: string }>) => void;
}

export function ChatInput({ chatId, onOptimisticUpdate }: ChatInputProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  const { user } = useUser();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAction = async (formData: FormData) => {
    const prompt = formData.get('prompt') as string;
    if (!prompt) return;

    formRef.current?.reset();
    
    startTransition(async () => {
      const userMessage: Message = {
          id: `user-${Date.now()}`,
          role: Role.USER,
          content: prompt,
          timestamp: new Date().toISOString(),
      };

      const aiPromise = sendMessage(formData);

      if (onOptimisticUpdate) {
        onOptimisticUpdate(userMessage, aiPromise.then(res => ({...res, aiMessage: res.aiMessage || null})));
      }
      
      const res = await aiPromise;

      if (res.error) {
        toast({ variant: 'destructive', title: 'An error occurred', description: res.error });
        return;
      }
      
      if (user?.isAnonymous) {
        if (res.aiMessage) {
            const allChats = JSON.parse(localStorage.getItem('guest_chats') || '{}');
            const chatHistory = chatId ? allChats[chatId] || [] : [];
            const newHistory = [...chatHistory, userMessage, res.aiMessage];
            const newChatId = res.newChatId || chatId || `guest-chat-${Date.now()}`;
            
            allChats[newChatId] = newHistory;
            localStorage.setItem('guest_chats', JSON.stringify(allChats));
            
            if(!chatId) { // new chat
                const guestChatIndex = JSON.parse(localStorage.getItem('guest_chat_index') || '[]');
                guestChatIndex.unshift({ id: newChatId, title: prompt.substring(0, 30) });
                localStorage.setItem('guest_chat_index', JSON.stringify(guestChatIndex));
                router.push(`/c/${newChatId}`);
            } else {
                window.dispatchEvent(new Event('storage'));
            }
        }
      } else {
        if (res.newChatId && !chatId) {
            // Let the optimistic update handle the UI, but refresh to get sidebar changes
            router.refresh();
        }
      }
    });
  };

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        handleAction(formData);
      }}
      className="inline-flex w-full items-center gap-2"
    >
      {chatId && <input type="hidden" name="chatId" value={chatId} />}
      {user && <input type="hidden" name="userId" value={user.uid} />}
      {user && <input type="hidden" name="isGuest" value={user.isAnonymous ? 'true' : 'false'} />}
      <Textarea
        name="prompt"
        placeholder="Ask me anything..."
        className="min-h-12 flex-1 resize-none"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            formRef.current?.requestSubmit();
          }
        }}
        disabled={!user || isPending}
      />
      <Button
        type="submit"
        size="icon"
        disabled={isPending || !user}
        aria-label="Send message"
        className=''
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <SendHorizonal className="h-5 w-5" />
        )}
      </Button>
    </form>
  );
}
