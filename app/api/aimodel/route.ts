import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  ui?: string;
};

type UiState =
  | "location"
  | "destination"
  | "groupSize"
  | "budget"
  | "duration"
  | "interests"
  | "final";

const DEFAULT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

/* ---------------------------------- */
/* CHATBOT FLOW (NO API CALLS HERE)  */
/* ---------------------------------- */

const CHAT_FLOW: { resp: string; ui: UiState }[] = [
  {
    resp: "Hi 👋 Where are you travelling from?",
    ui: "location",
  },
  {
    resp: "Great! What's your destination?",
    ui: "destination",
  },
  {
    resp: "How many people are travelling?",
    ui: "groupSize",
  },
  {
    resp: "What's your total budget for the trip?",
    ui: "budget",
  },
  {
    resp: "How many days will you travel?",
    ui: "duration",
  },
  {
    resp: "What are your interests? (adventure, food, nature, shopping etc.)",
    ui: "interests",
  },
  {
    resp: "Perfect ✨ Ready to generate your complete trip plan?",
    ui: "final",
  },
];

/* ---------------------------------- */
/* HELPERS                            */
/* ---------------------------------- */

function extractResponseText(result: any): string {
  const parts = result?.candidates?.[0]?.content?.parts;

  if (!Array.isArray(parts)) return "{}";

  return parts
    .map((part: any) => part?.text || "")
    .join("")
    .trim();
}

function parseJsonSafely(input: string) {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

function sanitizeMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter(
    (msg) =>
      msg &&
      (msg.role === "user" || msg.role === "assistant") &&
      typeof msg.content === "string"
  );
}

/* ---------------------------------- */
/* UNSPLASH IMAGE SUPPORT             */
/* ---------------------------------- */

async function getImageFromUnsplash(searchTerm: string): Promise<string> {
  try {
    if (!process.env.UNSPLASH_ACCESS_KEY) {
      return DEFAULT_FALLBACK_IMAGE;
    }

    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        searchTerm
      )}&per_page=1&client_id=${process.env.UNSPLASH_ACCESS_KEY}`
    );

    if (!res.ok) return DEFAULT_FALLBACK_IMAGE;

    const data = await res.json();

    return data?.results?.[0]?.urls?.regular || DEFAULT_FALLBACK_IMAGE;
  } catch {
    return DEFAULT_FALLBACK_IMAGE;
  }
}

async function enhanceWithImages(tripData: any) {
  try {
    if (Array.isArray(tripData?.trip_plan?.hotels)) {
      for (const hotel of tripData.trip_plan.hotels) {
        const term =
          hotel?.hotel_search_term ||
          hotel?.name ||
          `${tripData.trip_plan.destination} hotel`;

        hotel.hotel_image_url = await getImageFromUnsplash(term);
      }
    }

    if (Array.isArray(tripData?.itinerary)) {
      for (const day of tripData.itinerary) {
        const groups = [
          day?.morning_activities,
          day?.afternoon_activities,
          day?.evening_activities,
        ];

        for (const group of groups) {
          if (!Array.isArray(group)) continue;

          for (const item of group) {
            const term =
              item?.place_search_term ||
              item?.place_name ||
              item?.name ||
              tripData.trip_plan.destination;

            item.place_image_url = await getImageFromUnsplash(term);
          }
        }
      }
    }

    return tripData;
  } catch {
    return tripData;
  }
}

/* ---------------------------------- */
/* STEP CHAT LOGIC (NO GEMINI CALL)   */
/* ---------------------------------- */

function getNextChatStep(messages: ChatMessage[]) {
  const userCount = messages.filter((m) => m.role === "user").length;

  const index =
    userCount >= CHAT_FLOW.length ? CHAT_FLOW.length - 1 : userCount;

  return CHAT_FLOW[index];
}

/* ---------------------------------- */
/* FINAL ONLY ONE GEMINI API CALL     */
/* ---------------------------------- */

async function generateFinalTrip(messages: ChatMessage[]) {
const userAnswers = messages
  .filter((m) => m.role === "user")
  .map((m) => m.content)
  .slice(0, 6);

  const [
    location = "",
    destination = "",
    groupSize = "",
    budget = "",
    duration = "",
    interests = "",
  ] = userAnswers;
const prompt = `
You are a professional travel planner.

Return ONLY valid JSON.

Create a complete detailed trip plan for:

Starting Location: ${location}
Destination: ${destination}
Group Size: ${groupSize}
Budget: ${budget}
Duration: ${duration}
Interests: ${interests}

JSON FORMAT:

{
  "trip_plan": {
    "origin": "${location}",
    "destination": "${destination}",
    "duration": "${duration}",
    "total_days": 3,
    "budget": "${budget}",
    "group_size": "${groupSize}",
    "hotels": [
      {
        "hotel_name": "Sample Hotel",
        "hotel_address": "Main area",
        "price_per_night": "$120",
        "rating": "4.5",
        "description": "Comfortable stay",
        "hotel_search_term": "hotel ${destination}"
      }
    ]
  },

  "itinerary": [
    {
      "day": 1,
      "day_theme": "Arrival and Explore",
      "day_plan": "Relax and city walk",

      "morning_activities": [
        {
          "place_name": "Central Park",
          "place_details": "Beautiful sightseeing area",
          "time_slot": "9 AM",
          "duration": "2 hrs",
          "ticket_pricing": "Free",
          "tips": "Go early",
          "place_search_term": "Central Park ${destination}"
        }
      ],

      "afternoon_activities": [],
      "evening_activities": [],

      "meals": {
        "breakfast": {
          "restaurant_name": "Cafe One",
          "cuisine_type": "Local"
        },
        "lunch": {
          "restaurant_name": "Food Plaza",
          "cuisine_type": "Mixed"
        },
        "dinner": {
          "restaurant_name": "Sky Dining",
          "cuisine_type": "Fine Dining"
        }
      }
    }
  ],

  "local_tips": [
    {
      "category": "Transport",
      "tip": "Use metro card"
    }
  ],

  "packing_suggestions": [
    "Shoes",
    "Jacket"
  ],

  "emergency_contacts": {
    "local_emergency": "112",
    "tourist_helpline": "12345"
  }
}
`;

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      temperature: 0.4,
      maxOutputTokens: 8192,
    },
  });

  const text = extractResponseText(result);

  const parsed = parseJsonSafely(text);

  if (!parsed) {
    return {
      error: "Failed to generate trip plan.",
    };
  }

  const enhanced = await enhanceWithImages(parsed);

  return enhanced;
}

/* ---------------------------------- */
/* API ROUTE                          */
/* ---------------------------------- */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const messagesRaw = body?.messages;
    const isFinal = Boolean(body?.isfinal);

    if (!Array.isArray(messagesRaw)) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      );
    }

    const messages = sanitizeMessages(messagesRaw);

    if (!messages.length) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    /* STEP CHAT MODE (NO API CALL) */
    if (!isFinal) {
      const step = getNextChatStep(messages);
      return NextResponse.json(step);
    }

    /* FINAL PLAN MODE (ONLY 1 API CALL) */
    const finalPlan = await generateFinalTrip(messages);

    return NextResponse.json(finalPlan);
  } catch (error) {
    console.error("API ERROR:", error);

    return NextResponse.json(
      {
        error: "Something went wrong.",
      },
      { status: 500 }
    );
  }
}