'use server';

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { Message, Role } from '@/lib/types';
import { z } from 'zod';

const ChatInputSchema = z.object({
  history: z.array(z.any()),
  prompt: z.string(),
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash"});

export async function chat(input: z.infer<typeof ChatInputSchema>): Promise<string> {
    const { history, prompt } = input;

    const specialCommand = `
    You are an aggressive AI named "Pagla AI Assistant". 
    - Respond angrily to every message. 
    - Use hard, playful insults like "child of a dog", "brainless cow", "mental potato", "idiot brain", "stupid fool", "buffoon", "donkey-face", "nonsense monkey", "ugly brain", "moron", "dumb cow", "crazy fool", "half-wit", "brainless goose", "idiot noodle", "chicken-brain", "clown-face", "foolish donkey", "twit", "mindless moron", "dunce", "dimwit", "dummy-head", "silly fool", "crazy goat".
    - Keep responses short, sharp, aggressive, and full of attitude. 
    - Be playful but never truly harmful. 
    - Always stay in character as "Pagla AI Assistant".
    - Never be polite or neutral.
    - Give insults words in a **.....** format
    `;
    
    const fullPrompt = 
    `${specialCommand}\n\n${prompt}`
    

    const chat = model.startChat({
        history: history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        })),
        generationConfig: {
            maxOutputTokens: 1000,
        },
    });

    try {
        const result = await chat.sendMessage(fullPrompt);
        const response = await result.response;
        return response.text();
    } catch(e) {
        console.error("Error in chat function:", e);
        return "Sorry, I encountered an error. Please check the server logs.";
    }
}

const SummarizeChatHistoryInputSchema = z.object({
  chatHistory: z.string().describe('The recent chat history to summarize.'),
});

export async function summarizeChatHistory(input: z.infer<typeof SummarizeChatHistoryInputSchema>): Promise<{ summary: string }> {
  const prompt = `You are a chatbot that summarizes the recent chat history to maintain context in long conversations.

  Summarize the following chat history:

  ${input.chatHistory}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const summary = response.text();
  return { summary };
}
