import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Sparkles, 
  CheckCircle, 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Star, 
  Phone, 
  Calendar, 
  Info, 
  Camera, 
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface FinalTripUIProps {
  onSelected: (value: string) => void;
  preferences: {
    startingLocation?: string;
    destination?: string;
    groupSize?: string;
    budget?: string;
    duration?: string;
    interests?: string;
  };
  tripData?: any;
  disable?: boolean;
}

export const FinalTripUI = ({ 
  onSelected, 
  preferences, 
  tripData, 
  disable = false 
}: FinalTripUIProps) => {
  const [expandedDays, setExpandedDays] = useState<number[]>([]);

  const toggleDay = (dayIndex: number) => {
    setExpandedDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(i => i !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  // Generate dynamic text based on actual user preferences
  const generateSummaryText = () => {
    const { destination, duration, budget, groupSize, interests } = preferences;
        
    let text = "Thanks for the details! ";
        
    if (!interests || interests.toLowerCase() === 'no' || interests.toLowerCase() === 'none') {
      text += "If you have no specific preferences for travel interests, I'll prepare a well-rounded itinerary for your ";
    } else {
      text += `I'll prepare an amazing itinerary focused on ${interests} for your `;
    }
        
    if (duration) text += `${duration} `;
    if (budget) text += `${budget.toLowerCase()}-budget `;
    if (destination) text += `trip to ${destination} `;
    if (groupSize) text += `for ${groupSize.toLowerCase()} `;
        
    text += "travel.";
        
    return text;
  };

  const generateRequestText = () => {
    const { startingLocation, destination, duration, groupSize, budget, interests } = preferences;
        
    let request = "Generate my complete ";
    if (duration) request += `${duration} `;
    if (destination) request += `${destination} `;
    request += "trip itinerary ";
    if (groupSize && groupSize.toLowerCase() !== 'just me') request += `for ${groupSize.toLowerCase()} `;
    if (budget) request += `with ${budget.toLowerCase()} budget `;
    if (startingLocation) request += `starting from ${startingLocation} `;
    if (interests && interests.toLowerCase() !== 'no' && interests.toLowerCase() !== 'none') {
      request += `focusing on ${interests}`;
    }
        
    return request;
  };

  // If no trip data, show the original planning UI
  if (!tripData) {
    return (
      <div className='mt-3 w-full'>
        <Card className='p-6 bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 shadow-sm'>
          <div className='text-center space-y-4'>
            {/* Header with Icon */}
            <div className='flex flex-col items-center gap-3'>
              <div className='p-3 bg-orange-100 rounded-full'>
                <Sparkles className='h-8 w-8 text-orange-600' />
              </div>
              <h3 className='font-semibold text-lg text-gray-800'>
                {generateSummaryText()}
              </h3>
            </div>
                          
            {/* Airplane Icon with Animation */}
            <div className='flex justify-center my-4'>
              <div className='text-4xl animate-bounce'>✈️</div>
            </div>
            
            {/* Planning Status */}
            <div className='bg-white/70 rounded-lg p-3 mb-4'>
              <p className='text-orange-600 font-medium text-sm flex items-center justify-center gap-2'>
                <CheckCircle className='h-4 w-4' />
                Planning your dream trip...
              </p>
              <p className='text-gray-600 text-xs mt-1'>
                Gathering best destinations, activities, and travel details for you.
              </p>
            </div>
            
            {/* Generate Trip Button */}
            <Button 
              onClick={() => onSelected(generateRequestText())}
              disabled={disable}
              className='w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200'
            >
              {disable ? 'Generating...' : 'Generate My Trip Plan'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // If trip data exists, show the complete trip details
  const { trip_plan, itinerary, local_tips } = tripData;

  return (
    <div className="w-full space-y-6">
      {/* Success Header */}
      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Your Trip to {trip_plan?.destination} is Ready! ✈️
          </h2>
          <div className="flex justify-center items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {trip_plan?.duration}
            </div>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              {trip_plan?.budget} Budget
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {trip_plan?.group_size}
            </div>
          </div>
        </div>
      </Card>

      {/* Hotels Section */}
      {trip_plan?.hotels && trip_plan.hotels.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-blue-500" />
            Recommended Hotels
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {trip_plan.hotels.map((hotel, index) => (
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-gray-800 text-lg">{hotel.hotel_name}</h4>
                  {hotel.rating && (
                    <div className="flex items-center bg-yellow-100 px-2 py-1 rounded-full">
                      <Star className="h-3 w-3 text-yellow-500 mr-1" />
                      <span className="text-xs font-medium text-yellow-700">{hotel.rating}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  {hotel.hotel_address && (
                    <div className="flex items-start text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{hotel.hotel_address}</span>
                    </div>
                  )}
                  
                  {hotel.price_per_night && (
                    <div className="flex items-center text-green-600 font-medium">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span>{hotel.price_per_night}</span>
                    </div>
                  )}
                  
                  {hotel.description && (
                    <p className="text-gray-600 mt-2">{hotel.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Itinerary Section */}
      {itinerary && itinerary.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-green-500" />
            Daily Itinerary
          </h3>
          <div className="space-y-3">
            {itinerary.map((day, dayIndex) => (
              <div key={dayIndex} className="border rounded-lg">
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleDay(dayIndex)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-800">Day {day.day}</h4>
                      {day.best_time_to_visit_day && (
                        <p className="text-sm text-blue-600">{day.best_time_to_visit_day}</p>
                      )}
                    </div>
                    {expandedDays.includes(dayIndex) ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  
                  {day.day_plan && (
                    <p className="text-gray-600 text-sm mt-2">{day.day_plan}</p>
                  )}
                </div>
                
                {expandedDays.includes(dayIndex) && day.activities && (
                  <div className="border-t bg-gray-50 p-4 space-y-3">
                    {day.activities.map((activity, actIndex) => (
                      <div key={actIndex} className="bg-white rounded-lg p-4 shadow-sm">
                        <h5 className="font-medium text-gray-800 mb-2">{activity.place_name}</h5>
                        
                        {activity.place_details && (
                          <p className="text-gray-600 text-sm mb-3">{activity.place_details}</p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          {activity.place_address && (
                            <div className="flex items-start">
                              <MapPin className="h-3 w-3 mr-1 mt-0.5 text-gray-500 flex-shrink-0" />
                              <span className="text-gray-600">{activity.place_address}</span>
                            </div>
                          )}
                          
                          {activity.opening_hours && (
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1 text-gray-500" />
                              <span className="text-gray-600">{activity.opening_hours}</span>
                            </div>
                          )}
                          
                          {activity.ticket_pricing && (
                            <div className="flex items-center">
                              <DollarSign className="h-3 w-3 mr-1 text-green-500" />
                              <span className="text-green-600">{activity.ticket_pricing}</span>
                            </div>
                          )}
                          
                          {activity.best_time_to_visit && (
                            <div className="flex items-center">
                              <Info className="h-3 w-3 mr-1 text-blue-500" />
                              <span className="text-blue-600">{activity.best_time_to_visit}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Local Tips Section */}
      {local_tips && local_tips.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Info className="h-5 w-5 mr-2 text-purple-500" />
            Local Tips & Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {local_tips.map((tip, index) => (
              <div key={index} className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded">
                <h4 className="font-medium text-gray-800 capitalize mb-2">{tip.category}</h4>
                <p className="text-gray-600 text-sm">{tip.tip}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Action Button */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-3">
            Ready to start your amazing journey? 🌟
          </p>
          <Button 
            onClick={() => window.print()}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Save or Print Itinerary
          </Button>
        </div>
      </Card>
    </div>
  );
};