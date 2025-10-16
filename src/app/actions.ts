'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, where, updateDoc } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';

import { Message, MessageSchema, Role } from '@/lib/types';
import { chat, summarizeChatHistory } from '@/ai/flows/chat';
import { getSdks } from '@/firebase';
import { firebaseConfig } from '@/firebase/config';

const sendMessageSchema = z.object({
  prompt: z.string().min(1, 'Message cannot be empty.'),
  chatId: z.string().optional(),
  userId: z.string(),
  isGuest: z.boolean(),
  guestHistory: z.array(MessageSchema).optional(),
});

function getFirestoreDB() {
    if (!getApps().length) {
        const app = initializeApp(firebaseConfig, 'server-side-app-for-action');
        return getSdks(app).firestore;
    }
    return getSdks(getApp('server-side-app-for-action')).firestore;
}

export async function sendMessage(formData: FormData): Promise<{ error?: string; aiMessage?: Message, newChatId?: string }> {
  const isGuest = formData.get('isGuest') === 'true';
  const guestHistoryString = formData.get('guestHistory') as string | null;
  
  let guestHistory: Message[] = [];
  if (isGuest && guestHistoryString) {
      try {
        guestHistory = JSON.parse(guestHistoryString);
      } catch (e) {
        // Will be caught by validator if parsing fails and guestHistory remains empty
      }
  }

  const promptValue = formData.get('prompt');
  const chatIdValue = formData.get('chatId');
  const userIdValue = formData.get('userId');

  const validatedFields = sendMessageSchema.safeParse({
    prompt: promptValue,
    chatId: chatIdValue || undefined,
    userId: userIdValue,
    isGuest,
    guestHistory: isGuest ? guestHistory : undefined,
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.prompt?.[0] || 'Invalid input.',
    };
  }

  const { prompt, chatId: currentChatId, userId } = validatedFields.data;

  if (!userId) {
    return {
      error: 'You must be logged in to send a message.',
    };
  }
  
  if (isGuest) {
      const userMessage: Message = {
        role: Role.USER,
        content: prompt,
        timestamp: new Date().toISOString(),
      };

      const historyForAI = [...guestHistory, userMessage];
      const aiResponseContent = await chat({ history: historyForAI.map(m => ({...m, role: m.role === 'user' ? 'user' : 'model'})), prompt });

      const aiMessage: Message = {
        id: `guest-msg-${Date.now()}`,
        role: Role.MODEL,
        content: aiResponseContent,
        timestamp: new Date().toISOString(),
      };

      const newChatId = currentChatId || `guest-chat-${Date.now()}`;

      return { aiMessage, newChatId };
  }


  let chatId = currentChatId;
  const db = getFirestoreDB();
  let aiMessage: Message;

  try {
    if (!userId) throw new Error("User ID is required for registered users.");
    
    // 1. Create chat session if it doesn't exist
    if (!chatId) {
        const chatCollection = collection(db, 'users', userId, 'chats');
        const newChatRef = await addDoc(chatCollection, {
            userId,
            title: prompt.substring(0, 30),
            createdAt: serverTimestamp(),
        });
        chatId = newChatRef.id;
    }

    // 2. Add user message to Firestore
    const messagesCollection = collection(db, 'users', userId, 'chat_messages');
    await addDoc(messagesCollection, { 
        role: 'user', 
        content: prompt, 
        chatId: chatId,
        timestamp: serverTimestamp() 
    });
    
    // 3. Get full chat history and call AI
    const historyQuery = query(
        collection(db, 'users', userId, 'chat_messages'),
        where('chatId', '==', chatId),
        orderBy('timestamp', 'asc')
    );

    const historySnapshot = await getDocs(historyQuery);
    const history = historySnapshot.docs.map(doc => doc.data() as Message);
    
    const aiResponseContent = await chat({ history, prompt });

    // 4. Add AI response to Firestore
    const aiMessageRef = await addDoc(messagesCollection, { 
        role: 'model', 
        content: aiResponseContent, 
        chatId: chatId,
        timestamp: serverTimestamp()
    });
    aiMessage = {
      id: aiMessageRef.id,
      role: Role.MODEL,
      content: aiResponseContent,
      timestamp: new Date().toISOString() // This is an approximation
    };

    // 5. If it's a new chat, generate a title
    if (!currentChatId) {
      const fullHistoryText = history
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join('\n');
      const { summary } = await summarizeChatHistory({
        chatHistory: `${fullHistoryText}\nmodel: ${aiResponseContent}`,
      });
      const chatDocRef = doc(db, 'users', userId, 'chats', chatId);
      await updateDoc(chatDocRef, { title: summary });
      revalidatePath('/'); // Revalidate sidebar for new title
    }

  } catch (error) {
    console.error('Error in sendMessage:', error);
    if (error instanceof Error && error.message.includes('429')) {
      return { error: 'You have exceeded your API quota. Please check your plan and billing details.' };
    }
    return { error: 'An unexpected error occurred. Please try again.' };
  }
  
  // 6. Redirect if new chat
  if (!currentChatId && chatId) {
    redirect(`/c/${chatId}`);
  }
  
  // Return the AI message for optimistic UI update on the client
  return { aiMessage, newChatId: chatId };
}
