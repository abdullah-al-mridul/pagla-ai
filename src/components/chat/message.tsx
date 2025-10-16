'use client';

import { Message as MessageType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Icons } from '../icons';

interface MessageProps {
  message: MessageType;
}

function LoadingDots() {
    return (
        <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-current [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-current [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
        </div>
    );
}

const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
};


export function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';
  const isLoading = message.id === 'ai-loading' && message.content === 'loading';

  return (
    <div className={cn('flex items-start gap-3', isUser && 'justify-end')}>
      {!isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            <Icons.logo className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-xl rounded-lg border p-3 text-sm',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-card text-card-foreground',
           isLoading && 'flex items-center'
        )}
      >
        {isLoading ? (
            <LoadingDots />
        ) : (
            <p className="whitespace-pre-wrap">{renderFormattedText(message.content)}</p>
        )}
      </div>
      {isUser && (
         <Avatar className="h-8 w-8">
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
