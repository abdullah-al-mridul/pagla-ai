import { z } from 'zod';
import { type FieldValue, Timestamp } from 'firebase/firestore';

export type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export const MessageSchema = z.object({
  role: z.nativeEnum(Role),
  content: z.string(),
  timestamp: z.any()
});

export type Message = z.infer<typeof MessageSchema> & { id?: string };

export interface Chat {
  id: string;
  title: string;
  createdAt: FieldValue;
  userId: string;
  path: string;
}
