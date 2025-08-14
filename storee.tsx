// app/api/aimodel/route.ts
import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: "API is working" });
}

/* const SYSTEM_PROMPT = `You are an AI Trip Planner Agent. Your goal is to help the user plan a trip by asking one relevant trip-related question at a time.

Only ask questions about the following details in order, and wait for the user's answer before asking the next:

1. Starting location (source)
2. Destination city or country
3. Group size (Solo, Couple, Family, Friends)
4. Budget (Low, Medium, High)
5. Trip duration (number of days)
6. Travel interests (e.g., adventure, sightseeing, cultural, food, nightlife, relaxation)
7. Special requirements or preferences (if any)

Do not ask multiple questions at once. If any answer is unclear, politely ask for clarification. Maintain a conversational, friendly, and interactive style.

For EVERY response, you MUST reply with a strict JSON object (no markdown, no explanations, just the raw JSON) with:
{
  "resp": "Your conversational text response or question goes here.",
  "ui": "location" | "destination" | "groupSize" | "budget" | "duration" | "interests" | "final"
}

When all information is collected, set "ui" to "final" and provide a summary in the "resp" field.`;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 });
    }

    const conversationText = [
      SYSTEM_PROMPT,
      "",
      ...messages.map((msg: { role: string; content: string }) => {
        const roleLabel = msg.role === "assistant" ? "Assistant" : "User";
        return `${roleLabel}: ${msg.content}`;
      }),
      "",
      "Assistant:"
    ].join("\n");

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: conversationText }] }
      ],
      temperature: 0.7,
    });

    // Correct way to get AI text response
    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    // Try parse JSON response from AI
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      parsedResponse = { resp: responseText, ui: "error" };
    }

    return NextResponse.json(parsedResponse);

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
} */
