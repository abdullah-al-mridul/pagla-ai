'use client';

import { Button } from './ui/button';
import { Plus, MessageSquare, Menu } from 'lucide-react';
import { Icons } from './icons';
import { UserNav } from './user-nav';
import { ThemeToggle } from './theme-toggle';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useEffect, useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { Chat } from '@/lib/types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { collection, query, orderBy } from 'firebase/firestore';
import { ScrollArea } from './ui/scroll-area';
import { Loader2 } from 'lucide-react';

interface SidebarProps {
  userId: string;
}

function ChatHistory({ userId }: { userId: string }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();
  const [localChats, setLocalChats] = useState<{id: string, title: string}[]>([]);

  const chatsQuery = useMemoFirebase(
    () =>
      user && !user.isAnonymous
        ? query(
            collection(firestore, 'users', user.uid, 'chats'),
            orderBy('createdAt', 'desc')
          )
        : null,
    [firestore, user]
  );

  const { data: firestoreChats, isLoading } = useCollection<Chat>(chatsQuery);

  const handleStorageChange = () => {
    if (user?.isAnonymous) {
      const guestChatIndex = JSON.parse(localStorage.getItem('guest_chat_index') || '[]');
      setLocalChats(guestChatIndex);
    }
  };

  useEffect(() => {
    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]);

  if (isLoading && !user?.isAnonymous) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  
  const chats = user?.isAnonymous ? localChats : firestoreChats;

  if (!chats?.length) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No chat history.
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col gap-1 p-2">
        {chats.map((chat) => (
          <Button
            key={chat.id}
            variant={pathname === `/c/${chat.id}` ? 'secondary' : 'ghost'}
            className="w-full justify-start gap-2"
            asChild
          >
            <Link href={`/c/${chat.id}`}>
              <MessageSquare className="h-4 w-4" />
              <span className="truncate">{chat.title}</span>
            </Link>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

function SidebarContent({ userId }: SidebarProps) {
  return (
    <div className="flex h-full w-full flex-col bg-card text-card-foreground">
      <div className="flex items-center justify-between border-b p-2 pr-10">
        <div className="flex items-center gap-2">
          <Icons.logo className="h-7 w-7 text-primary" />
          <h1 className="font-headline text-lg font-semibold">Pagla AI</h1>
        </div>
        <ThemeToggle />
      </div>
      <div className="p-2">
        <Button className="w-full justify-start gap-2" asChild>
          <Link href="/">
            <Plus className="h-4 w-4" /> New Chat
          </Link>
        </Button>
      </div>
      <ChatHistory userId={userId} />
      <div className="mt-auto border-t p-2">
        <UserNav />
      </div>
    </div>
  );
}

export function Sidebar({ userId }: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="absolute top-2 left-2 z-10">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SidebarContent userId={userId} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden h-full w-72 flex-shrink-0 border-r md:flex">
        <SidebarContent userId={userId} />
      </aside>
    </>
  );
}
