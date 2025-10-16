'use client';

import { Icons } from '@/components/icons';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { redirect, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();

  useEffect(() => {
    if (!isUserLoading && user) {
      redirect('/');
    }
  }, [user, isUserLoading]);

  if (isUserLoading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="mb-6 flex items-center gap-3 text-2xl font-bold text-foreground">
        <Icons.logo className="h-8 w-8 text-primary" />
        <span className="font-headline">Pagla AI</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
      <p className="mt-8 animate-fade-in-down text-center text-sm font-light text-muted-foreground">
        This custom AI chatbot developed by{' '}
        <a
          href="https://github.com/abdullah-al-mridul"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Abdullah Al Mridul
        </a>
      </p>
    </div>
  );
}
