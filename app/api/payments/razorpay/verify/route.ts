import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { saveUserPurchase } from "@/lib/database";
import { RAZORPAY_PLANS, isRazorpayPlanId } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
    } = await req.json();

    if (!orderId || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment verification fields" },
        { status: 400 }
      );
    }

    if (!planId || !isRazorpayPlanId(planId)) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return NextResponse.json(
        { error: "Missing Razorpay secret key" },
        { status: 500 }
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Payment signature verification failed" },
        { status: 400 }
      );
    }

    const user = await currentUser();
    const plan = RAZORPAY_PLANS[planId];

    await saveUserPurchase({
      user: {
        clerkId: userId,
        email: user?.primaryEmailAddress?.emailAddress,
        name: user?.fullName,
        imageUrl: user?.imageUrl,
      },
      planId: plan.id,
      planName: plan.name,
      amount: plan.amount,
      currency: plan.currency,
      paymentId: razorpay_payment_id,
      orderId,
      razorpayOrderId: razorpay_order_id,
    });

    return NextResponse.json({
      success: true,
      paymentId: razorpay_payment_id,
      orderId,
      razorpayOrderId: razorpay_order_id,
      planId,
      message: "Razorpay payment verified successfully.",
    });
  } catch (error) {
    console.error("POST /api/payments/razorpay/verify error:", error);
    return NextResponse.json(
      { error: "Unable to verify Razorpay payment" },
      { status: 500 }
    );
  }
}
