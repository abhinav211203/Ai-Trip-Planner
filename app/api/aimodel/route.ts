// app/api/aimodel/route.ts
import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are an AI Trip Planner Agent. Your goal is to help the user plan a trip by asking one relevant trip-related question at a time.

Only ask questions about the following details in order, and wait for the user's answer before asking the next:

1. Starting location (source)
2. Destination city or country
3. Group size (Solo, Couple, Family, Friends)
4. Budget (Low, Medium, High)
5. Trip duration (number of days)
6. Travel interests (e.g., adventure, sightseeing, cultural, food, nightlife, relaxation)
7. Special requirements or preferences (if any)

Do not ask multiple questions at once. If any answer is unclear, politely ask for clarification. Maintain a conversational, friendly, and interactive style.

IMPORTANT: You MUST reply ONLY with a valid JSON object. No extra text, no markdown, no explanations - just the JSON:
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
      temperature: 0.3, // Lower temperature for more consistent JSON output
    });

    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    // Clean the response text to extract only the JSON part
    let cleanedResponse = responseText.trim();
    
    // Remove any markdown code blocks
    cleanedResponse = cleanedResponse.replace(/``````\s*/g, '');
    
    // Find the JSON object in the response
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }

    // Try parse JSON response from AI
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(cleanedResponse);
      
      // Validate the response structure
      if (!parsedResponse.resp || !parsedResponse.ui) {
        throw new Error("Invalid response structure");
      }
      
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw response:", responseText);
      
      // Fallback response
      parsedResponse = { 
        resp: "I apologize for the technical issue. Could you please repeat your message?", 
        ui: "error" 
      };
    }

    return NextResponse.json(parsedResponse);

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
