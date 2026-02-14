import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const config = {
  runtime: 'edge',
};

// Create OpenRouter instance using OpenAI-compatible SDK
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const messages = body.messages || [];

    // Clean messages to ensure only role and content are sent to OpenRouter
    const cleanMessages = messages.map(({ role, content }) => ({ role, content }));

    const result = streamText({
      model: openrouter('google/gemini-2.0-flash-001'),
      system: 'You are ClawdNote Assistant. You help users with their notes. You can write content, summarize, and format text. Use markdown for all responses.',
      messages: cleanMessages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
