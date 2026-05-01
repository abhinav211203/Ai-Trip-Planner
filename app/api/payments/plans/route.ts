import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPurchasedPlanIdsForUser } from "@/lib/database";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ purchasedPlanIds: [] });
    }

    const purchasedPlanIds = await getPurchasedPlanIdsForUser(userId);

    return NextResponse.json({ purchasedPlanIds });
  } catch (error) {
    console.error("GET /api/payments/plans error:", error);
    return NextResponse.json(
      { error: "Failed to load purchased plans" },
      { status: 500 }
    );
  }
}
