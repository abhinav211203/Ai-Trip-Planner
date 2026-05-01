import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  deleteTripForUser,
  getTripByIdForUser,
  getUserTrips,
  saveGeneratedTrip,
} from "@/lib/database";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get("id");

    if (tripId) {
      const trip = await getTripByIdForUser(userId, tripId);

      if (!trip) {
        return NextResponse.json({ error: "Trip not found" }, { status: 404 });
      }

      return NextResponse.json(trip);
    }

    const trips = await getUserTrips(userId);
    return NextResponse.json(trips);
  } catch (error) {
    console.error("GET /api/trips error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trips" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const body = await req.json();

    if (!body?.tripData) {
      return NextResponse.json({ error: "Trip data is required" }, { status: 400 });
    }

    const trip = await saveGeneratedTrip({
      user: {
        clerkId: userId,
        email: user?.primaryEmailAddress?.emailAddress,
        name: user?.fullName,
        imageUrl: user?.imageUrl,
      },
      preferences: body.preferences,
      tripData: body.tripData,
    });

    return NextResponse.json(trip, { status: 201 });
  } catch (error) {
    console.error("POST /api/trips error:", error);
    return NextResponse.json(
      { error: "Failed to save trip" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get("id");

    if (!tripId) {
      return NextResponse.json({ error: "Trip ID is required" }, { status: 400 });
    }

    const trip = await deleteTripForUser(userId, tripId);

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/trips error:", error);
    return NextResponse.json(
      { error: "Failed to delete trip" },
      { status: 500 }
    );
  }
}
