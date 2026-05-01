import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { hasUserPurchasedPlan } from "@/lib/database";
import { RAZORPAY_PLANS, isRazorpayPlanId } from "@/lib/razorpay";

function getBasicAuthHeader(keyId: string, keySecret: string) {
  const token = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  return `Basic ${token}`;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = await req.json();

    if (!planId || !isRazorpayPlanId(planId)) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    const alreadyPurchased = await hasUserPurchasedPlan(userId, planId);

    if (alreadyPurchased) {
      return NextResponse.json(
        { error: "You have already purchased this plan." },
        { status: 409 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Missing Razorpay test credentials" },
        { status: 500 }
      );
    }

    const plan = RAZORPAY_PLANS[planId];
    const receipt = `${plan.id}_${Date.now()}`;

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: getBasicAuthHeader(keyId, keySecret),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: plan.amount,
        currency: plan.currency,
        receipt,
        notes: {
          planId: plan.id,
          userId,
          mode: "test",
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.description || "Failed to create Razorpay order" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
      keyId,
      plan: {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        displayPrice: plan.displayPrice,
      },
    });
  } catch (error) {
    console.error("POST /api/payments/razorpay/order error:", error);
    return NextResponse.json(
      { error: "Unable to start Razorpay checkout" },
      { status: 500 }
    );
  }
}
