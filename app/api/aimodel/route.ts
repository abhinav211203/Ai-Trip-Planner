import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Enhanced system prompt for better day-by-day planning
const FINAL_PROMPT = `You are a professional travel planner. Generate a comprehensive and REALISTIC travel plan with DETAILED day-by-day itinerary.

CRITICAL REQUIREMENTS FOR ITINERARY:
1. Create detailed plans for EACH day of the trip
2. Include 3-5 activities per day with specific timing
3. Account for travel time between locations
4. Include meal recommendations for each day
5. Provide morning, afternoon, and evening activities
6. Use ONLY real hotel names, places, and accurate information
7. Include realistic pricing and GPS coordinates

DETAILED DAILY STRUCTURE REQUIRED:
- Morning activities (8:00 AM - 12:00 PM)
- Afternoon activities (12:00 PM - 6:00 PM)  
- Evening activities (6:00 PM - 10:00 PM)
- Recommended restaurants for breakfast, lunch, dinner
- Transportation details between activities

For each day, you MUST include:
- Minimum 4-6 activities spread throughout the day
- Specific time slots for each activity
- Travel duration between locations
- Entry fees and costs
- Best time to visit each location
- Why this timing is optimal

ENSURE COMPLETE COVERAGE: If the trip is X days, provide detailed plans for ALL X days without exception.

Output Schema with COMPLETE DAY-BY-DAY DETAILS:
{
  "trip_plan": {
    "destination": "string",
    "duration": "string", 
    "total_days": number,
    "origin": "string",
    "budget": "string",
    "group_size": "string",
    "hotels": [
      {
        "hotel_name": "string (REAL existing hotel)",
        "hotel_address": "string (complete REAL address)",
        "price_per_night": "string",
        "hotel_search_term": "string",
        "geo_coordinates": {
          "latitude": number,
          "longitude": number
        },
        "rating": number,
        "description": "string",
        "contact_info": "string",
        "check_in": "string",
        "check_out": "string"
      }
    ]
  },
  "itinerary": [
    {
      "day": number,
      "date": "string (if specific dates provided)",
      "day_theme": "string (e.g., 'Cultural Exploration', 'Adventure Day')",
      "day_plan": "string (comprehensive overview of the day)",
      "weather_info": "string (typical weather for the season)",
      "daily_budget_estimate": "string",
      "morning_activities": [
        {
          "time_slot": "string (e.g., '8:00 AM - 10:00 AM')",
          "activity_type": "string (sightseeing/food/transport/etc)",
          "place_name": "string (REAL location)",
          "place_details": "string (detailed description)",
          "place_search_term": "string",
          "geo_coordinates": {
            "latitude": number,
            "longitude": number
          },
          "place_address": "string (REAL address)",
          "ticket_pricing": "string",
          "duration": "string (time to spend here)",
          "why_this_time": "string (reason for timing)",
          "tips": "string (specific advice)"
        }
      ],
      "afternoon_activities": [
        {
          "time_slot": "string",
          "activity_type": "string",
          "place_name": "string (REAL location)",
          "place_details": "string",
          "place_search_term": "string",
          "geo_coordinates": {
            "latitude": number,
            "longitude": number
          },
          "place_address": "string",
          "ticket_pricing": "string",
          "duration": "string",
          "why_this_time": "string",
          "tips": "string"
        }
      ],
      "evening_activities": [
        {
          "time_slot": "string",
          "activity_type": "string",
          "place_name": "string (REAL location)",
          "place_details": "string",
          "place_search_term": "string",
          "geo_coordinates": {
            "latitude": number,
            "longitude": number
          },
          "place_address": "string",
          "ticket_pricing": "string",
          "duration": "string",
          "why_this_time": "string",
          "tips": "string"
        }
      ],
      "meals": {
        "breakfast": {
          "restaurant_name": "string (REAL restaurant)",
          "cuisine_type": "string",
          "address": "string",
          "price_range": "string",
          "recommended_dishes": ["string"],
          "time": "string"
        },
        "lunch": {
          "restaurant_name": "string",
          "cuisine_type": "string", 
          "address": "string",
          "price_range": "string",
          "recommended_dishes": ["string"],
          "time": "string"
        },
        "dinner": {
          "restaurant_name": "string",
          "cuisine_type": "string",
          "address": "string", 
          "price_range": "string",
          "recommended_dishes": ["string"],
          "time": "string"
        }
      },
      "transportation": {
        "primary_mode": "string",
        "daily_transport_cost": "string",
        "transport_tips": "string"
      }
    }
  ],
  "local_tips": [
    {
      "category": "string",
      "tip": "string"
    }
  ],
  "packing_suggestions": ["string"],
  "emergency_contacts": {
    "local_emergency": "string",
    "tourist_helpline": "string"
  }
}

IMPORTANT: Generate plans for ALL days of the trip. If it's a 5-day trip, provide detailed itineraries for all 5 days. Do not skip any days.`;

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

Respond with a JSON object containing your conversational response and the appropriate UI state.`;

// Helper function to validate itinerary completeness
function validateItinerary(tripData: any): any {
  console.log('🔍 Validating itinerary completeness...');
  
  if (!tripData.itinerary || !Array.isArray(tripData.itinerary)) {
    console.error('❌ Missing or invalid itinerary array');
    return tripData;
  }

  const totalDays = tripData.trip_plan?.total_days || tripData.itinerary.length;
  console.log(`📅 Expected ${totalDays} days, got ${tripData.itinerary.length} days`);

  // Ensure we have itinerary for all days
  for (let i = 1; i <= totalDays; i++) {
    const dayExists = tripData.itinerary.find((day: any) => day.day === i);
    if (!dayExists) {
      console.warn(`⚠️ Missing day ${i} in itinerary`);
      // Add a placeholder day if missing
      tripData.itinerary.push({
        day: i,
        day_theme: `Day ${i} Activities`,
        day_plan: `Planned activities for day ${i}`,
        morning_activities: [],
        afternoon_activities: [],
        evening_activities: [],
        meals: {
          breakfast: { restaurant_name: "Local cafe", time: "8:00 AM" },
          lunch: { restaurant_name: "Local restaurant", time: "1:00 PM" },
          dinner: { restaurant_name: "Local restaurant", time: "7:00 PM" }
        }
      });
    }
  }

  // Sort days by day number
  tripData.itinerary.sort((a: any, b: any) => a.day - b.day);

  console.log('✅ Itinerary validation completed');
  return tripData;
}

// Helper function to get real images from Unsplash API
async function getImageFromUnsplash(searchTerm: string): Promise<string> {
  try {
    if (!process.env.UNSPLASH_ACCESS_KEY) {
      return `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80`;
    }
    
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=1&client_id=${process.env.UNSPLASH_ACCESS_KEY}`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].urls.regular;
      }
    }
    
    return `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80`;
  } catch (error) {
    console.error('Error fetching image:', error);
    return `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80`;
  }
}

// Enhanced function to add images to all activities
async function enhanceWithRealImages(tripData: any): Promise<any> {
  try {
    console.log('🖼️ Enhancing trip data with real images...');
    
    // Add images to hotels
    if (tripData.trip_plan?.hotels) {
      for (let hotel of tripData.trip_plan.hotels) {
        if (hotel.hotel_search_term) {
          hotel.hotel_image_url = await getImageFromUnsplash(hotel.hotel_search_term);
        }
      }
    }
    
    // Add images to all daily activities
    if (tripData.itinerary) {
      for (let day of tripData.itinerary) {
        // Morning activities
        if (day.morning_activities) {
          for (let activity of day.morning_activities) {
            if (activity.place_search_term) {
              activity.place_image_url = await getImageFromUnsplash(activity.place_search_term);
            }
          }
        }
        
        // Afternoon activities  
        if (day.afternoon_activities) {
          for (let activity of day.afternoon_activities) {
            if (activity.place_search_term) {
              activity.place_image_url = await getImageFromUnsplash(activity.place_search_term);
            }
          }
        }
        
        // Evening activities
        if (day.evening_activities) {
          for (let activity of day.evening_activities) {
            if (activity.place_search_term) {
              activity.place_image_url = await getImageFromUnsplash(activity.place_search_term);
            }
          }
        }
      }
    }
    
    console.log('✅ Image enhancement completed');
    return tripData;
  } catch (error) {
    console.error('Error enhancing with real images:', error);
    return tripData;
  }
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function POST(req: NextRequest) {
  console.log('🔌 API Route hit')
  try {
    const body = await req.json();
    console.log('📦 Request body:', body)
    
    const { messages, isfinal } = body;
    
    console.log('📊 Parsed data:', { 
      messagesCount: messages?.length, 
      isfinal,
      lastMessage: messages?.[messages?.length - 1]
    })

    if (!messages || !Array.isArray(messages)) {
      console.log('❌ Invalid messages')
      return NextResponse.json({ error: "Messages are required" }, { status: 400 });
    }

    if (isfinal) {
      console.log('🎯 Processing FINAL trip generation with complete day-by-day itinerary')
      
      const conversationText = [
        FINAL_PROMPT,
        "",
        ...messages.map((msg: { role: string; content: string }) => {
          const roleLabel = msg.role === "assistant" ? "Assistant" : "User";
          return `${roleLabel}: ${msg.content}`;
        }),
        "",
        "Generate a COMPLETE trip plan with detailed day-by-day itinerary covering ALL days of the trip:"
      ].join("\n");

      console.log('🤖 Calling Gemini for comprehensive trip generation...')
      
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: conversationText }] }
        ],
        config: {
          temperature: 0.4, // Increased for more creative and comprehensive responses
          maxOutputTokens: 8192, // Increased token limit for detailed itineraries
          responseMimeType: "application/json"
        }
      });

      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log('🤖 Gemini raw response length:', responseText?.length)

      if (!responseText) {
        console.log('❌ No response from Gemini')
        return NextResponse.json({ error: "No response from AI" }, { status: 500 });
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
        console.log('✅ Parsed trip response');
        console.log('📅 Itinerary days found:', parsedResponse.itinerary?.length);
        
        // Validate and enhance the itinerary
        parsedResponse = validateItinerary(parsedResponse);
        
        // Enhance with real images
        console.log('🖼️ Enhancing with real images...')
        parsedResponse = await enhanceWithRealImages(parsedResponse);
        
      } catch (parseError) {
        console.error("❌ JSON parse error:", parseError);
        console.error("❌ Raw response that failed:", responseText?.substring(0, 500));
        return NextResponse.json({ 
          error: "Failed to generate complete trip plan. Please try again." 
        }, { status: 500 });
      }

      console.log('📤 Sending complete trip response to client');
      console.log('📊 Final itinerary has', parsedResponse.itinerary?.length, 'days');
      return NextResponse.json(parsedResponse);

    } else {
      console.log('💬 Processing normal conversation')
      
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
        config: {
          temperature: 0.3,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              resp: {
                type: "string",
                description: "Your conversational text response or question"
              },
              ui: {
                type: "string",
                enum: ["location", "destination", "groupSize", "budget", "duration", "interests", "final"],
                description: "Current UI state based on conversation progress"
              }
            },
            required: ["resp", "ui"]
          }
        }
      });

      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) {
        return NextResponse.json({ error: "No response from AI" }, { status: 500 });
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
        
        if (!parsedResponse.resp || !parsedResponse.ui) {
          throw new Error("Invalid response structure");
        }
        
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        console.error("Raw response:", responseText);
        
        parsedResponse = { 
          resp: "I apologize for the technical issue. Could you please repeat your message?", 
          ui: "error" 
        };
      }

      return NextResponse.json(parsedResponse);
    }

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ 
      error: "Something went wrong. Please try again."
    }, { status: 500 });
  }
}