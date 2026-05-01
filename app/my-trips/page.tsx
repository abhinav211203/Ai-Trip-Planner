"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import {
  Calendar,
  ChevronRight,
  Loader2,
  MapPin,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type StoredTrip = {
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

function getTripCover(trip: StoredTrip) {
  return (
    trip.tripData?.trip_plan?.hotels?.[0]?.hotel_image_url ||
    trip.tripData?.itinerary?.[0]?.morning_activities?.[0]?.place_image_url ||
    "https://images.unsplash.com/photo-1507525428034-b723a9ce6890?w=1200&h=800&fit=crop&q=80"
  );
}

function getTripSummary(trip: StoredTrip) {
  const interests = trip.interests?.trim();

  if (interests) {
    return interests;
  }

  return "Personalized AI-generated itinerary";
}

export default function MyTripsPage() {
  const [trips, setTrips] = useState<StoredTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTrips = async () => {
      try {
        const response = await axios.get("/api/trips");
        setTrips(response.data as StoredTrip[]);
      } catch (loadError: unknown) {
        console.error("Error loading trips:", loadError);
        setError("Failed to load your saved trips.");
      } finally {
        setIsLoading(false);
      }
    };

    loadTrips();
  }, []);

  const handleDelete = async (tripId: string) => {
    try {
      setIsDeleting(tripId);
      setError("");
      await axios.delete(`/api/trips?id=${tripId}`);
      setTrips((prev) => prev.filter((trip) => trip.id !== tripId));
    } catch (deleteError: unknown) {
      console.error("Error deleting trip:", deleteError);
      setError("Failed to delete this trip.");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7,_#fff_35%,_#e2e8f0_100%)] p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_25px_80px_rgba(15,23,42,0.10)] backdrop-blur">
          <div className="grid gap-8 px-6 py-8 md:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div className="space-y-4">
              <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
                Saved journeys
              </span>
              <div className="space-y-3">
                <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                  My Trips
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                  Each card opens its own full trip page now, so the itinerary no longer appears below the grid.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-slate-900 p-4 text-white shadow-lg">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Trips</p>
                <p className="mt-3 text-3xl font-bold">{trips.length}</p>
              </div>
              <div className="rounded-2xl bg-emerald-100 p-4 text-emerald-900">
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">Latest</p>
                <p className="mt-3 line-clamp-2 text-sm font-semibold">
                  {trips[0]?.destination || "None"}
                </p>
              </div>
              <div className="rounded-2xl bg-sky-100 p-4 text-sky-900">
                <p className="text-xs uppercase tracking-[0.18em] text-sky-700">Status</p>
                <p className="mt-3 text-sm font-semibold">
                  {isLoading ? "Loading" : trips.length ? "Ready" : "Empty"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-5 text-slate-700 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading your saved trips...
          </div>
        ) : trips.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/80 p-12 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-slate-800">No trips saved yet</h2>
            <p className="mt-3 text-slate-600">
              Generate a trip from the planner and it will show up here as a clickable card.
            </p>
          </div>
        ) : (
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {trips.map((trip) => {
              const coverImage = getTripCover(trip);

              return (
                <div
                  key={trip.id}
                  className="group overflow-hidden rounded-[1.75rem] border border-white/60 bg-white text-left shadow-[0_18px_45px_rgba(15,23,42,0.10)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.16)]"
                >
                  <Link href={`/my-trips/${trip.id}`} className="block">
                    <div
                      className="relative h-56 bg-cover bg-center"
                      style={{
                        backgroundImage: `linear-gradient(to top, rgba(15,23,42,0.88), rgba(15,23,42,0.16)), url(${coverImage})`,
                      }}
                    >
                      <div className="flex h-full flex-col justify-between p-5 text-white">
                        <div className="flex items-start justify-between gap-3">
                          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur">
                            Saved {new Date(trip.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <h2 className="text-2xl font-bold leading-tight">{trip.destination}</h2>
                          <p className="line-clamp-2 text-sm text-slate-100/90">
                            {getTripSummary(trip)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 p-5">
                      <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                        {trip.duration ? (
                          <span className="rounded-full bg-slate-100 px-3 py-1">{trip.duration}</span>
                        ) : null}
                        {trip.budget ? (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">
                            {trip.budget}
                          </span>
                        ) : null}
                        {trip.groupSize ? (
                          <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-800">
                            {trip.groupSize}
                          </span>
                        ) : null}
                      </div>

                      <div className="grid gap-3 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span className="line-clamp-1">
                            {trip.origin ? `${trip.origin} to ` : ""}
                            {trip.destination}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span>{new Date(trip.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-slate-400" />
                          <span>{trip.groupSize || "Group size not set"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-slate-400" />
                          <span>{trip.budget || "Budget not set"}</span>
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900">
                        View full details
                        <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </Link>

                  <div className="border-t border-slate-100 px-5 py-4">
                    <Button
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleDelete(trip.id)}
                      disabled={isDeleting === trip.id}
                    >
                      {isDeleting === trip.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Delete Trip
                    </Button>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}
