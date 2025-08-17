"use client"

import React from 'react';
import { 
  Navigation, 
  Calendar, 
  Users, 
  DollarSign 
} from 'lucide-react';

interface LoadingTripDisplayProps {
  preferences: {
    destination?: string;
    duration?: string;
    groupSize?: string;
    budget?: string;
    startingLocation?: string;
  } | null;
}

export const LoadingTripDisplay = ({ preferences }: LoadingTripDisplayProps) => {
  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl overflow-hidden">
      {/* Header with placeholder data from preferences */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 text-white p-6 animate-pulse">
        <h1 className="text-4xl font-extrabold mb-2 bg-white/20 h-10 w-1/2 rounded-md">
            {preferences?.destination}
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-blue-100">
          {preferences?.startingLocation && <span className="flex items-center"><Navigation className="h-4 w-4 mr-1.5" /> From {preferences.startingLocation}</span>}
          {preferences?.duration && <span className="flex items-center"><Calendar className="h-4 w-4 mr-1.5" /> {preferences.duration}</span>}
          {preferences?.groupSize && <span className="flex items-center"><Users className="h-4 w-4 mr-1.5" /> {preferences.groupSize}</span>}
          {preferences?.budget && <span className="flex items-center"><DollarSign className="h-4 w-4 mr-1.5" /> {preferences.budget} Budget</span>}
        </div>
      </div>

      {/* Content area with the loading message */}
      <div className="p-6 h-[calc(100vh-150px)] flex flex-col items-center justify-center text-center">
        <div className="space-y-4">
          <div className="text-2xl font-bold text-gray-800">
            Generating Your Dream Trip... ✨
          </div>
          <p className="text-gray-600">
            Please wait while our AI assistant crafts the perfect itinerary for you.
          </p>
          <div className="relative flex justify-center items-center pt-4">
            <div className="absolute w-12 h-12 rounded-full animate-spin border-4 border-dashed border-blue-500 border-t-transparent"></div>
            <div className="w-8 h-8 rounded-full bg-blue-100"></div>
          </div>
        </div>
      </div>
    </div>
  );
};