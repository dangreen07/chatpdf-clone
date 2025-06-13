import { NextRequest } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return new Response("OpenAI API key not configured", { status: 500 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.responses.create({
      model: "gpt-4.1-nano",
      input: [
        {
            role: "developer",
            content: "You are a helpful assistant that can answer questions and help with tasks. You must respond in markdown format."
        },
        ...messages,
      ],
      temperature: 0.7,
      stream: true
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // No custom deduplication; forward deltas as-is
          
          for await (const chunk of response) {
            if (chunk.type === 'response.output_text.delta' && chunk.delta) {
              const text = new TextEncoder().encode(chunk.delta);
              controller.enqueue(text);
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response("Server error", { status: 500 });
  }
} 