"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, Calendar, Loader2, MapPin, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import TripDisplay from "../../create-new-trip/_components/Tripdetail";

type TripRecord = {
  id: string;
  title: string;
  origin?: string | null;
  destination: string;
  duration?: string | null;
  budget?: string | null;
  groupSize?: string | null;
  interests?: string | null;
  tripData: any;
  createdAt: string;
};

export default function TripDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [trip, setTrip] = useState<TripRecord | null>(null);
  const [tripId, setTripId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTrip = async () => {
      try {
        const resolved = await params;
        setTripId(resolved.id);
        const response = await axios.get(`/api/trips?id=${resolved.id}`);
        setTrip(response.data as TripRecord);
      } catch (loadError: unknown) {
        console.error("Error loading trip:", loadError);
        setError("Failed to load this trip.");
      } finally {
        setIsLoading(false);
      }
    };

    loadTrip();
  }, [params]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#fff_35%,_#f8fafc_100%)] p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <Link
              href="/my-trips"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to My Trips
            </Link>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              {trip?.title || "Trip details"}
            </h1>
          </div>

          {trip ? (
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-slate-700 shadow-sm">
                <MapPin className="h-4 w-4" />
                {trip.origin ? `${trip.origin} to ` : ""}
                {trip.destination}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-slate-700 shadow-sm">
                <Calendar className="h-4 w-4" />
                {trip.duration || "Duration not set"}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-slate-700 shadow-sm">
                <Users className="h-4 w-4" />
                {trip.groupSize || "Group size not set"}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-slate-700 shadow-sm">
                <Wallet className="h-4 w-4" />
                {trip.budget || "Budget not set"}
              </span>
            </div>
          ) : null}
        </div>

        {isLoading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-5 text-slate-700 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading trip details...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : trip ? (
          <TripDisplay tripData={trip.tripData} />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-slate-600">
            Trip not found for id `{tripId}`.
            <div className="mt-4">
              <Link href="/my-trips">
                <Button>Go back</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
