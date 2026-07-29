import { NextResponse } from 'next/server';

export const maxDuration = 30;

const MAX_INPUT_LENGTH = 500;
const MAX_MESSAGES_STORE = 200;

let messageCount = 0;
let windowStart = Date.now();

function checkRateLimit(): boolean {
  const now = Date.now();
  if (now - windowStart > 60000) {
    messageCount = 0;
    windowStart = now;
  }
  if (messageCount >= MAX_MESSAGES_STORE) {
    return false;
  }
  messageCount += 1;
  return true;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request body. Expected { message: string }.' },
        { status: 400 }
      );
    }

    const message = body.message.trim();

    if (message.length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty.' },
        { status: 400 }
      );
    }

    if (message.length > MAX_INPUT_LENGTH) {
      return NextResponse.json(
        { error: `Message exceeds maximum length of ${MAX_INPUT_LENGTH} characters.` },
        { status: 413 }
      );
    }

    if (!checkRateLimit()) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before trying again.' },
        { status: 429 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service is not configured. Please set OPENAI_API_KEY.' },
        { status: 500 }
      );
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [{ role: 'user', content: message }],
              stream: true,
              max_tokens: 500,
            }),
          });

          if (!aiResponse.ok) {
            const errBody = await aiResponse.text();
            controller.enqueue(encoder.encode(`Error: ${errBody}`));
            controller.close();
            return;
          }

          const aiReader = aiResponse.body?.getReader();
          if (!aiReader) {
            controller.enqueue(encoder.encode('Error: No response from AI service.'));
            controller.close();
            return;
          }

          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await aiReader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
                const data = trimmed.slice(6);
                try {
                  const parsed = JSON.parse(data);
                  const text = parsed.choices?.[0]?.delta?.content;
                  if (text) {
                    controller.enqueue(encoder.encode(text));
                  }
                } catch {
                  continue;
                }
              }
            }
          }

          controller.close();
        } catch (err) {
          controller.enqueue(
            encoder.encode(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}