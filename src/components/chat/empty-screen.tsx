'use client';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { sendMessage } from '@/app/actions';
import { Card } from '../ui/card';

const exampleMessages = [
  'What are the laws of thermodynamics?',
  'Explain quantum computing in simple terms',
  'Write a short story about a robot who discovers music',
  'What are some healthy dinner recipes?',
];

export function EmptyScreen() {
  const { pending } = useFormStatus();

  return (
    <div className="mx-auto max-w-2xl px-4">
      <Card className="p-8">
        <h1 className="mb-2 text-lg font-semibold">Welcome to Pagla AI!</h1>
        <p className="mb-4 leading-normal text-muted-foreground">
          Start a conversation by typing a message below or try one of these
          examples.
        </p>
        <div className="space-y-2">
          {exampleMessages.map((message, index) => (
            <form action={sendMessage} key={index}>
              <input type="hidden" name="prompt" value={message} />
              <Button
                variant="link"
                className="h-auto p-0 text-base text-primary text-left whitespace-normal"
                type="submit"
                disabled={pending}
              >
                {message}
              </Button>
            </form>
          ))}
        </div>
      </Card>
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
