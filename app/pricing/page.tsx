"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  BadgeCheck,
  BedDouble,
  Check,
  CreditCard,
  Globe2,
  Loader2,
  Plane,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

const plans = [
  {
    name: "Explorer",
    price: "Rs 0",
    subtitle: "For travelers who want fast AI trip planning.",
    accent: "from-sky-500 via-cyan-500 to-emerald-400",
    badge: "Free Start",
    cta: "Start Planning",
    href: "/create-new-trip",
    planId: null,
    features: [
      "AI-generated trip itinerary",
      "Destination ideas and inspiration",
      "Budget, duration, and group-based planning",
      "Save trips to your account",
      "View and reopen past trips",
    ],
  },
  {
    name: "Smart Booker",
    price: "Rs 1499",
    subtitle: "For users who want trip planning plus booking assistance.",
    accent: "from-amber-500 via-orange-500 to-rose-500",
    badge: "Most Popular",
    cta: "Buy In Test Mode",
    href: "/create-new-trip",
    planId: "smart_booker",
    features: [
      "Everything in Explorer",
      "Flight booking assistance",
      "Hotel booking suggestions and booking flow",
      "Priority hidden-gems itineraries",
      "Smarter recommendations based on travel style",
      "Faster support for trip changes",
    ],
  },
  {
    name: "Concierge Guide",
    price: "Rs 4999",
    subtitle: "For premium travel with bookings and trip-guide support.",
    accent: "from-slate-900 via-slate-800 to-slate-700",
    badge: "Premium",
    cta: "Buy In Test Mode",
    href: "/create-new-trip",
    planId: "concierge_guide",
    features: [
      "Everything in Smart Booker",
      "Dedicated trip guide recommendations",
      "Custom day-by-day premium itinerary",
      "Flight + hotel + guide bundle planning",
      "VIP support for itinerary changes",
      "Premium trip coordination experience",
    ],
  },
] as const;

const featureRows = [
  {
    icon: Plane,
    title: "Flight Booking",
    description:
      "Compare and plan flights as part of the same trip workflow instead of jumping between tools.",
  },
  {
    icon: BedDouble,
    title: "Hotel Booking",
    description:
      "Turn recommended stays into bookable choices matched to your budget and travel style.",
  },
  {
    icon: Users,
    title: "Trip Guide Support",
    description:
      "Offer local guide and premium support options for travelers who want a more managed experience.",
  },
];

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PricingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [purchasedPlanIds, setPurchasedPlanIds] = useState<string[]>([]);
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(true);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentError, setPaymentError] = useState("");

  useEffect(() => {
    const loadPurchasedPlans = async () => {
      try {
        setIsLoadingPurchases(true);
        const response = await fetch("/api/payments/plans");
        const data = await response.json();

        if (response.ok) {
          setPurchasedPlanIds(Array.isArray(data?.purchasedPlanIds) ? data.purchasedPlanIds : []);
        }
      } catch (error) {
        console.error("Failed to load purchased plans:", error);
      } finally {
        setIsLoadingPurchases(false);
      }
    };

    loadPurchasedPlans();
  }, [user?.id]);

  const handlePurchase = async (planId: string) => {
    if (!user) {
      router.push("/sign-in");
      return;
    }

    if (purchasedPlanIds.includes(planId)) {
      window.alert("You have already purchased this plan.");
      return;
    }

    try {
      setLoadingPlanId(planId);
      setPaymentError("");
      setPaymentMessage("");

      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || !window.Razorpay) {
        setPaymentError("Unable to load Razorpay checkout.");
        return;
      }

      const orderResponse = await fetch("/api/payments/razorpay/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        setPaymentError(orderData?.error || "Failed to create test payment order.");
        return;
      }

      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "AI Trip Planner",
        description: `${orderData.plan.name} test purchase`,
        order_id: orderData.orderId,
        prefill: {
          name: user.fullName || "",
          email: user.primaryEmailAddress?.emailAddress || "",
        },
        notes: {
          planId: orderData.plan.id,
          testMode: "true",
        },
        theme: {
          color: "#f59e0b",
        },
        handler: async (response: Record<string, string>) => {
          const verifyResponse = await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderId: orderData.orderId,
              planId: orderData.plan.id,
              ...response,
            }),
          });

          const verifyData = await verifyResponse.json();

          if (!verifyResponse.ok) {
            setPaymentError(verifyData?.error || "Payment verification failed.");
            return;
          }

          setPurchasedPlanIds((prev) =>
            prev.includes(orderData.plan.id) ? prev : [...prev, orderData.plan.id]
          );
          setPaymentMessage(
            `${orderData.plan.name} test payment successful. Payment ID: ${verifyData.paymentId}`
          );
        },
        modal: {
          ondismiss: () => {
            setPaymentMessage("Razorpay test checkout was closed before completion.");
          },
        },
      });

      razorpay.open();
    } catch (error) {
      console.error("Razorpay checkout error:", error);
      setPaymentError("Something went wrong while starting the test checkout.");
    } finally {
      setLoadingPlanId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#fff_38%,#f8fafc_100%)]">
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_25px_80px_rgba(15,23,42,0.10)] backdrop-blur">
          <div className="grid gap-10 px-6 py-10 md:px-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-900">
                <Sparkles className="h-4 w-4" />
                Plans For Every Kind Of Trip
              </span>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                  Plan it, book it, and travel with the right support.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                  Start with AI itinerary generation, then unlock booking features like flights,
                  hotels, and trip-guide support as your travel needs grow.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/create-new-trip">
                  <Button size="lg">Try Trip Planner</Button>
                </Link>
                <Link href="/my-trips">
                  <Button variant="outline" size="lg">
                    View My Trips
                  </Button>
                </Link>
              </div>
              {paymentMessage ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {paymentMessage}
                </div>
              ) : null}
              {paymentError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {paymentError}
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
                <Globe2 className="h-7 w-7 text-amber-300" />
                <h2 className="mt-4 text-2xl font-bold">AI Travel Core</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Smart itinerary creation built around budget, duration, and travel style.
                </p>
              </div>
              <div className="rounded-3xl bg-emerald-100 p-6 text-emerald-950">
                <CreditCard className="h-7 w-7" />
                <h2 className="mt-4 text-2xl font-bold">Booking Layer</h2>
                <p className="mt-2 text-sm leading-6 text-emerald-800">
                  Extend the product into real travel actions like hotel and flight booking.
                </p>
              </div>
              <div className="rounded-3xl bg-sky-100 p-6 text-sky-950">
                <ShieldCheck className="h-7 w-7" />
                <h2 className="mt-4 text-2xl font-bold">Premium Support</h2>
                <p className="mt-2 text-sm leading-6 text-sky-800">
                  Add guide and concierge experiences for travelers who want more than planning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10 md:px-10">
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const isPurchased = plan.planId ? purchasedPlanIds.includes(plan.planId) : false;
            const isBusy = plan.planId ? loadingPlanId === plan.planId : false;

            return (
              <div
                key={plan.name}
                className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-2 bg-gradient-to-r ${plan.accent}`}
                />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                      {plan.badge}
                    </span>
                    <h2 className="mt-4 text-3xl font-black text-slate-900">{plan.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{plan.subtitle}</p>
                  </div>
                </div>

                <div className="mt-8 flex items-end gap-2">
                  <span className="text-5xl font-black text-slate-900">{plan.price}</span>
                  <span className="pb-2 text-sm font-medium text-slate-500">/ month</span>
                </div>

                <div className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-emerald-100 p-1 text-emerald-700">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-sm leading-6 text-slate-700">{feature}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  {plan.planId ? (
                    isPurchased ? (
                      <Button
                        className="w-full"
                        size="lg"
                        variant="outline"
                        onClick={() => handlePurchase(plan.planId)}
                      >
                        <ShoppingBag className="h-4 w-4" />
                        Already Purchased
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => handlePurchase(plan.planId)}
                        disabled={isBusy || isLoadingPurchases}
                      >
                        {isBusy ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Starting Checkout...
                          </>
                        ) : isLoadingPurchases ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Checking Plan...
                          </>
                        ) : (
                          plan.cta
                        )}
                      </Button>
                    )
                  ) : (
                    <Button asChild className="w-full" size="lg">
                      <Link href={plan.href}>{plan.cta}</Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 md:px-10">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] md:p-8">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl font-black text-slate-900">Future booking-focused features</h2>
            <p className="text-slate-600">
              These are the premium product directions your pricing plans can clearly communicate.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {featureRows.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200"
                >
                  <div className="inline-flex rounded-2xl bg-white p-3 text-slate-900 shadow-sm">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 md:px-10">
        <div className="overflow-hidden rounded-[2rem] bg-slate-900 px-6 py-10 text-white shadow-[0_25px_70px_rgba(15,23,42,0.22)] md:px-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-slate-200">
                <BadgeCheck className="h-4 w-4 text-amber-300" />
                Build Beyond Basic Planning
              </div>
              <h2 className="max-w-3xl text-3xl font-black leading-tight">
                Turn this into a full travel product with planning, bookings, and concierge support.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                Your current app already handles itinerary generation well. These pricing tiers now give it
                a much clearer business structure and product story.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/create-new-trip">
                <Button size="lg" variant="secondary">
                  Start With Explorer
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  Compare Plans Again
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
