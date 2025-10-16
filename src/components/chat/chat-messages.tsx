'use client';

import { Message as MessageType } from '@/lib/types';
import { useEffect, useRef } from 'react';
import { Message } from './message';

interface ChatMessagesProps {
  messages: MessageType[];
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  return (
    <div className="space-y-4 p-4">
      {messages.map((message, index) => (
        <Message key={index} message={message} />
      ))}
       <div ref={messagesEndRef} />
    </div>
  );
}
