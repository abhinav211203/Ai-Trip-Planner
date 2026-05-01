import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

type UserInput = {
  clerkId: string;
  email?: string | null;
  name?: string | null;
  imageUrl?: string | null;
};

type SaveTripInput = {
  user: UserInput;
  preferences?: Record<string, string>;
  tripData: any;
};

type SavePurchaseInput = {
  user: UserInput;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  paymentId: string;
  orderId: string;
  razorpayOrderId?: string | null;
};

function buildTripTitle(destination?: string) {
  return destination ? `Trip to ${destination}` : "My saved trip";
}

export async function ensureUser(input: UserInput) {
  return prisma.user.upsert({
    where: { clerkId: input.clerkId },
    update: {
      email: input.email ?? null,
      name: input.name ?? undefined,
      imageUrl: input.imageUrl ?? undefined,
    },
    create: {
      clerkId: input.clerkId,
      email: input.email ?? null,
      name: input.name ?? undefined,
      imageUrl: input.imageUrl ?? undefined,
    },
  });
}

export async function saveGeneratedTrip(input: SaveTripInput) {
  const dbUser = await ensureUser(input.user);
  const tripPlan = input.tripData?.trip_plan ?? {};

  return prisma.trip.create({
    data: {
      userId: dbUser.id,
      title: buildTripTitle(tripPlan.destination ?? input.preferences?.destination),
      origin: tripPlan.origin ?? input.preferences?.startingLocation ?? null,
      destination: tripPlan.destination ?? input.preferences?.destination ?? "Unknown",
      duration: tripPlan.duration ?? input.preferences?.duration ?? null,
      budget: tripPlan.budget ?? input.preferences?.budget ?? null,
      groupSize: tripPlan.group_size ?? input.preferences?.groupSize ?? null,
      interests: input.preferences?.interests ?? null,
      tripData: input.tripData as Prisma.InputJsonValue,
    },
    select: {
      id: true,
      title: true,
      destination: true,
      createdAt: true,
    },
  });
}

export async function getUserTrips(clerkId: string) {
  return prisma.trip.findMany({
    where: {
      user: {
        clerkId,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      origin: true,
      destination: true,
      duration: true,
      budget: true,
      groupSize: true,
      interests: true,
      tripData: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getTripByIdForUser(clerkId: string, tripId: string) {
  return prisma.trip.findFirst({
    where: {
      id: tripId,
      user: {
        clerkId,
      },
    },
    select: {
      id: true,
      title: true,
      origin: true,
      destination: true,
      duration: true,
      budget: true,
      groupSize: true,
      interests: true,
      tripData: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function deleteTripForUser(clerkId: string, tripId: string) {
  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      user: {
        clerkId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!trip) {
    return null;
  }

  await prisma.trip.delete({
    where: {
      id: tripId,
    },
  });

  return trip;
}

export async function getPurchasedPlanIdsForUser(clerkId: string) {
  const purchases = await prisma.purchase.findMany({
    where: {
      user: {
        clerkId,
      },
    },
    select: {
      planId: true,
    },
  });

  return purchases.map((purchase) => purchase.planId);
}

export async function hasUserPurchasedPlan(clerkId: string, planId: string) {
  const purchase = await prisma.purchase.findFirst({
    where: {
      planId,
      user: {
        clerkId,
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(purchase);
}

export async function saveUserPurchase(input: SavePurchaseInput) {
  const dbUser = await ensureUser(input.user);

  return prisma.purchase.upsert({
    where: {
      userId_planId: {
        userId: dbUser.id,
        planId: input.planId,
      },
    },
    update: {
      planName: input.planName,
      amount: input.amount,
      currency: input.currency,
      paymentId: input.paymentId,
      orderId: input.orderId,
      razorpayOrderId: input.razorpayOrderId ?? null,
    },
    create: {
      userId: dbUser.id,
      planId: input.planId,
      planName: input.planName,
      amount: input.amount,
      currency: input.currency,
      paymentId: input.paymentId,
      orderId: input.orderId,
      razorpayOrderId: input.razorpayOrderId ?? null,
    },
    select: {
      id: true,
      planId: true,
      planName: true,
      paymentId: true,
    },
  });
}
