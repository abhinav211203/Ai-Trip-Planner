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

type PlannerMode = "default" | "inspire" | "hidden-gems" | "smart";

type ExtractedRequirements = {
  startingLocation?: string;
  destination?: string;
  groupSize?: string;
  budget?: string;
  duration?: string;
  interests?: string;
};

type SmartPlannerResponse = {
  resp: string;
  ui: UiState;
  extracted?: ExtractedRequirements;
  readyForFinal?: boolean;
};

const DEFAULT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

const CHAT_FLOW: { resp: string; ui: UiState }[] = [
  {
    resp: "Hi! Where are you travelling from?",
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
    resp: "Perfect! Ready to generate your complete trip plan?",
    ui: "final",
  },
];

const INSPIRE_CHAT_FLOW: { resp: string; ui: UiState }[] = [
  {
    resp: "Let's find a destination you'll love. Where are you travelling from?",
    ui: "location",
  },
  {
    resp: "What's your total budget for this trip?",
    ui: "budget",
  },
  {
    resp: "How many people are travelling?",
    ui: "groupSize",
  },
  {
    resp: "How many days will you travel?",
    ui: "duration",
  },
  {
    resp: "What are your interests? (nature, adventure, food, culture, relaxation etc.)",
    ui: "interests",
  },
  {
    resp: "Perfect! Ready for destination ideas and a complete trip plan?",
    ui: "final",
  },
];

const HIDDEN_GEMS_CHAT_FLOW: { resp: string; ui: UiState }[] = [
  {
    resp: "Amazing choice. Where are you travelling from?",
    ui: "location",
  },
  {
    resp: "Which destination or region do you want hidden gems for?",
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
    resp: "What kind of hidden gems do you enjoy? (food, nature, quiet places, culture, local experiences)",
    ui: "interests",
  },
  {
    resp: "Perfect! Ready to generate your hidden-gems itinerary?",
    ui: "final",
  },
];

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

function getChatFlow(mode: PlannerMode) {
  if (mode === "inspire") return INSPIRE_CHAT_FLOW;
  if (mode === "hidden-gems") return HIDDEN_GEMS_CHAT_FLOW;
  return CHAT_FLOW;
}

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

function getNextChatStep(messages: ChatMessage[], mode: PlannerMode) {
  const flow = getChatFlow(mode);
  const userCount = messages.filter((m) => m.role === "user").length;
  const index = userCount >= flow.length ? flow.length - 1 : userCount;
  return flow[index];
}

async function extractSmartRequirements(
  messages: ChatMessage[]
): Promise<SmartPlannerResponse | null> {
  const conversation = messages
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");

  const prompt = `
You are an assistant that extracts trip-planning requirements from a casual conversation.

Your job:
- Read the conversation.
- Extract any clearly stated trip requirements.
- Ask only one next question for the most important missing field.
- Be natural and conversational.
- If enough information is available, mark the response ready for final trip generation.
- Correct obvious spelling mistakes in city or place names if they are clearly intended.

Required fields:
- startingLocation
- destination
- groupSize
- budget
- duration
- interests

Rules:
- If the user gave a freeform request, infer as many fields as you reliably can.
- If a field is not clear, leave it empty.
- If all fields are present, set "ui" to "final" and "readyForFinal" to true.
- If something is missing, set "ui" to the missing field you want to ask for next.
- The "resp" should sound casual, helpful, and human.

Return ONLY valid JSON in this shape:
{
  "resp": "casual assistant reply",
  "ui": "location" | "destination" | "groupSize" | "budget" | "duration" | "interests" | "final",
  "readyForFinal": true,
  "extracted": {
    "startingLocation": "",
    "destination": "",
    "groupSize": "",
    "budget": "",
    "duration": "",
    "interests": ""
  }
}

Conversation:
${conversation}
`;

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      temperature: 0.2,
      maxOutputTokens: 2048,
    },
  });

  return parseJsonSafely(extractResponseText(result));
}

function buildStandardTripPrompt(
  location: string,
  destination: string,
  groupSize: string,
  budget: string,
  duration: string,
  interests: string,
  hiddenGemsInstruction = ""
) {
  return `
You are a professional travel planner.

Return ONLY valid JSON.

Before creating the itinerary:
- Correct obvious spelling mistakes in city, town, state, and country names.
- If a place name is clearly intended but misspelled, use the corrected real place name in the JSON.
- If the location is ambiguous and you cannot confidently infer the intended place, keep the original user input.
- Example: "ottu" should be interpreted as "Ooty" only if that is the most likely travel destination from context.
${hiddenGemsInstruction}

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
}

async function generateFinalTrip(
  messages: ChatMessage[],
  mode: PlannerMode,
  extractedPreferences?: ExtractedRequirements
) {
  let prompt = "";

  if (mode === "smart") {
    const extracted =
      extractedPreferences || (await extractSmartRequirements(messages))?.extracted || {};

    prompt = buildStandardTripPrompt(
      extracted.startingLocation || "",
      extracted.destination || "",
      extracted.groupSize || "",
      extracted.budget || "",
      extracted.duration || "",
      extracted.interests || ""
    );
  } else if (mode === "inspire") {
    const userAnswers = messages
      .filter((m) => m.role === "user")
      .map((m) => m.content);

    const [
      location = "",
      budget = "",
      groupSize = "",
      duration = "",
      interests = "",
    ] = userAnswers;

    prompt = `
You are a professional travel planner.

Return ONLY valid JSON.

Choose the best real travel destination based on the user's budget, trip length, interests, and group size.
- Pick a real destination city or region.
- Correct obvious place-name mistakes if needed.
- In "trip_plan.destination", write the final recommended destination.
- Focus on practical, appealing recommendations.

Create a complete detailed trip plan for:

Starting Location: ${location}
Recommended Destination: Choose the best destination
Group Size: ${groupSize}
Budget: ${budget}
Duration: ${duration}
Interests: ${interests}

JSON FORMAT:

{
  "trip_plan": {
    "origin": "${location}",
    "destination": "Recommended destination here",
    "duration": "${duration}",
    "total_days": 3,
    "budget": "${budget}",
    "group_size": "${groupSize}",
    "why_this_destination": "Short reason why this destination fits the user",
    "hotels": [
      {
        "hotel_name": "Sample Hotel",
        "hotel_address": "Main area",
        "price_per_night": "$120",
        "rating": "4.5",
        "description": "Comfortable stay",
        "hotel_search_term": "hotel recommended destination"
      }
    ]
  },

  "itinerary": [
    {
      "day": 1,
      "day_theme": "Arrival and Explore",
      "day_plan": "Relax and city walk",
      "morning_activities": [],
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
      "tip": "Use local transport smartly"
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
  } else {
    const userAnswers = messages
      .filter((m) => m.role === "user")
      .map((m) => m.content);

    const [
      location = "",
      destination = "",
      groupSize = "",
      budget = "",
      duration = "",
      interests = "",
    ] = userAnswers;

    const hiddenGemsInstruction =
      mode === "hidden-gems"
        ? `
- Prioritize hidden gems, offbeat spots, quieter local experiences, and lesser-known places.
- Avoid making the itinerary too tourist-heavy unless essential.
`
        : "";

    prompt = buildStandardTripPrompt(
      location,
      destination,
      groupSize,
      budget,
      duration,
      interests,
      hiddenGemsInstruction
    );
  }

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messagesRaw = body?.messages;
    const isFinal = Boolean(body?.isfinal);
    const mode = (body?.mode || "default") as PlannerMode;
    const extractedPreferences = body?.extractedPreferences as
      | ExtractedRequirements
      | undefined;

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

    if (!isFinal) {
      if (mode === "smart") {
        const smartResponse = await extractSmartRequirements(messages);

        if (smartResponse) {
          return NextResponse.json(smartResponse);
        }
      }

      const step = getNextChatStep(messages, mode);
      return NextResponse.json(step);
    }

    const finalPlan = await generateFinalTrip(
      messages,
      mode,
      extractedPreferences
    );
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
