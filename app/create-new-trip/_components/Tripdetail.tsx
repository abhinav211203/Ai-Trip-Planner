"use client"

import React, { useState } from 'react';
import { 
  MapPin, Clock, DollarSign, Users, Star, Phone, Calendar, Info, 
  ChevronDown, ChevronUp, Navigation, Ticket, Sun, Building, 
  Utensils, Heart, Briefcase, Ambulance, ShieldCheck, Moon, Coffee, Award
} from 'lucide-react';

interface TripDisplayProps {
  tripData?: any;
  preferences?: any;
}

// Helper Card for key information
const InfoCard = ({ icon: Icon, value, label }: { icon: React.ElementType, value: string, label: string }) => (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center text-white">
        <Icon className="h-6 w-6 mx-auto mb-1 opacity-80" />
        <div className="font-semibold text-lg">{value}</div>
        <div className="text-xs opacity-80">{label}</div>
    </div>
);

const TripDisplay = ({ tripData, preferences }: TripDisplayProps) => {
    const [expandedDays, setExpandedDays] = useState<number[]>([1]); // Day 1 expanded by default
    const [favoriteActivities, setFavoriteActivities] = useState<string[]>([]);

    const toggleDay = (dayIndex: number) => {
        setExpandedDays(prev => 
            prev.includes(dayIndex) 
                ? prev.filter(i => i !== dayIndex)
                : [...prev, dayIndex]
        );
    };

    const toggleFavorite = (activityName: string) => {
        setFavoriteActivities(prev => 
            prev.includes(activityName)
                ? prev.filter(name => name !== activityName)
                : [...prev, activityName]
        );
    };

    if (!tripData) {
        return <div>Error: No trip data provided.</div>;
    }

    const { trip_plan, itinerary, local_tips, packing_suggestions, emergency_contacts } = tripData;
    
    // Use the first hotel image as a fallback header background
    const headerImageUrl = trip_plan?.hotels?.[0]?.hotel_image_url || 'https://images.unsplash.com/photo-1507525428034-b723a9ce6890?w=1200&h=400&fit=crop&q=80';

    const allActivitiesForDay = (day: any) => {
        const morning = day.morning_activities?.map((a: any) => ({ ...a, period: 'Morning', icon: Coffee })) || [];
        const afternoon = day.afternoon_activities?.map((a: any) => ({ ...a, period: 'Afternoon', icon: Sun })) || [];
        const evening = day.evening_activities?.map((a: any) => ({ ...a, period: 'Evening', icon: Moon })) || [];
        return [...morning, ...afternoon, ...evening];
    };

    return (
        <div className="h-full bg-slate-100 rounded-2xl overflow-y-auto">
            {/* HEADER SECTION */}
            <header 
                className="relative h-64 rounded-t-2xl bg-cover bg-center text-white p-8 flex flex-col justify-end" 
                style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.1)), url(${headerImageUrl})` }}
            >
                <h1 className="text-5xl font-extrabold drop-shadow-lg">{trip_plan?.destination}</h1>
                <p className="text-lg opacity-90 drop-shadow-md">Your personalized itinerary awaits.</p>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InfoCard icon={Calendar} value={trip_plan?.duration} label="Duration" />
                    <InfoCard icon={Users} value={trip_plan?.group_size} label="Group Size" />
                    <InfoCard icon={DollarSign} value={trip_plan?.budget} label="Budget" />
                    <InfoCard icon={Navigation} value={trip_plan?.origin} label="Origin" />
                </div>
            </header>

            <main className="p-4 md:p-8 space-y-10">
                {/* ACCOMMODATION SECTION */}
                {trip_plan?.hotels?.length > 0 && (
                    <section>
                        <h2 className="text-3xl font-bold text-gray-800 flex items-center mb-4"><Building className="h-8 w-8 mr-3 text-blue-600" /> Accommodation</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {trip_plan.hotels.map((hotel: any, index: number) => (
                                <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform hover:scale-105 duration-300">
                                    <img src={hotel.hotel_image_url} alt={hotel.hotel_name} className="w-full h-56 object-cover" />
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-xl font-semibold text-gray-900">{hotel.hotel_name}</h3>
                                            {hotel.rating && <div className="flex items-center bg-yellow-400 text-white px-3 py-1 rounded-full text-sm font-bold"><Star className="h-4 w-4 mr-1.5 fill-current" />{hotel.rating}</div>}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-4">{hotel.description}</p>
                                        <div className="text-sm text-gray-500 space-y-2 border-t pt-3">
                                            <p className="flex items-center"><MapPin size={16} className="mr-2"/> {hotel.hotel_address}</p>
                                            <p className="flex items-center"><DollarSign size={16} className="mr-2"/> {hotel.price_per_night}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ITINERARY SECTION */}
                {itinerary?.length > 0 && (
                    <section>
                        <h2 className="text-3xl font-bold text-gray-800 flex items-center mb-4"><Calendar className="h-8 w-8 mr-3 text-green-600" /> Daily Itinerary</h2>
                        <div className="space-y-4">
                            {itinerary.map((day: any) => (
                                <div key={day.day} className="bg-white rounded-xl shadow-lg overflow-hidden">
                                    <div className="p-5 cursor-pointer hover:bg-green-50 flex justify-between items-center" onClick={() => toggleDay(day.day)}>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">Day {day.day}: <span className="text-green-700">{day.day_theme}</span></h3>
                                            <p className="text-sm text-gray-600 mt-1">{day.day_plan}</p>
                                        </div>
                                        {expandedDays.includes(day.day) ? <ChevronUp className="text-green-600"/> : <ChevronDown className="text-green-600"/>}
                                    </div>
                                    
                                    {expandedDays.includes(day.day) && (
                                        <div className="border-t bg-gray-50/50 p-5">
                                            {/* --- ACTIVITY TIMELINE --- */}
                                            <div className="relative border-l-2 border-green-200 ml-4 pl-8 py-4 space-y-8">
                                                {allActivitiesForDay(day).map((activity: any, actIndex: number) => (
                                                    <div key={actIndex} className="relative">
                                                        <div className="absolute -left-[42px] top-1 h-6 w-6 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                                                            <activity.icon size={14} className="text-white"/>
                                                        </div>
                                                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                                            <img src={activity.place_image_url} alt={activity.place_name} className="w-full h-48 object-cover"/>
                                                            <div className="p-4">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div>
                                                                        <span className="text-xs font-semibold uppercase text-green-600">{activity.period} &middot; {activity.time_slot}</span>
                                                                        <h4 className="font-bold text-gray-900 text-lg">{activity.place_name}</h4>
                                                                    </div>
                                                                    <button onClick={() => toggleFavorite(activity.place_name)} className="p-1">
                                                                        <Heart className={`h-5 w-5 transition-all ${favoriteActivities.includes(activity.place_name) ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                                                                    </button>
                                                                </div>
                                                                <p className="text-gray-600 text-sm mb-4">{activity.place_details}</p>
                                                                <div className="flex flex-wrap gap-2 text-xs text-gray-700">
                                                                    {activity.ticket_pricing && <span className="flex items-center bg-gray-100 px-2 py-1 rounded"><Ticket size={14} className="mr-1"/> {activity.ticket_pricing}</span>}
                                                                    {activity.duration && <span className="flex items-center bg-gray-100 px-2 py-1 rounded"><Clock size={14} className="mr-1"/> {activity.duration}</span>}
                                                                </div>
                                                                {activity.tips && (
                                                                    <div className="mt-3 bg-yellow-50 border-l-4 border-yellow-300 p-3 rounded-r-lg">
                                                                        <p className="text-yellow-800 text-sm flex items-start"><Info size={16} className="mr-2 flex-shrink-0 mt-0.5"/> <strong>Tip:</strong> {activity.tips}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* --- MEALS SECTION --- */}
                                            <div className="mt-8">
                                                <h4 className="text-xl font-bold text-gray-700 mb-3 flex items-center"><Utensils className="mr-2 text-orange-500" /> Meal Plan</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                    {['breakfast', 'lunch', 'dinner'].map(mealType => (
                                                        day.meals?.[mealType] && (
                                                            <div key={mealType} className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                                                <h5 className="font-bold capitalize text-orange-800">{mealType}</h5>
                                                                <p className="text-gray-700">{day.meals[mealType].restaurant_name}</p>
                                                                <p className="text-xs text-gray-500">{day.meals[mealType].cuisine_type}</p>
                                                            </div>
                                                        )
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}
                
                {/* ADDITIONAL INFO GRID */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {local_tips?.length > 0 && (
                        <div>
                            <h2 className="text-3xl font-bold text-gray-800 flex items-center mb-4"><Award className="h-8 w-8 mr-3 text-purple-600" /> Local Tips</h2>
                            <div className="space-y-3">
                                {local_tips.map((tip: any, i: number) => 
                                <div key={i} className="bg-white p-4 rounded-lg shadow-md border-l-4 border-purple-400">
                                    <p className="font-semibold text-purple-800">{tip.category}</p>
                                    <p className="text-sm text-gray-600">{tip.tip}</p>
                                </div>)}
                            </div>
                        </div>
                    )}
                    {packing_suggestions?.length > 0 && (
                        <div>
                            <h2 className="text-3xl font-bold text-gray-800 flex items-center mb-4"><Briefcase className="h-8 w-8 mr-3 text-orange-600" /> Packing List</h2>
                            <ul className="list-inside list-disc bg-white p-5 rounded-lg shadow-md border-l-4 border-orange-400 space-y-2 text-sm text-gray-700">
                                {packing_suggestions.map((item: string, i: number) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                    )}
                </section>

                {/* EMERGENCY CONTACTS */}
                {emergency_contacts && (
                    <section>
                        <h2 className="text-3xl font-bold text-gray-800 flex items-center mb-4"><ShieldCheck className="h-8 w-8 mr-3 text-red-600" /> Emergency Info</h2>
                        <div className="bg-red-50 p-5 rounded-lg border-l-4 border-red-400 shadow-md flex items-center space-x-8 text-red-800 font-semibold">
                            <div className="flex items-center"><Ambulance className="h-5 w-5 mr-2"/> Local Emergency: {emergency_contacts.local_emergency}</div>
                            <div className="flex items-center"><Phone className="h-5 w-5 mr-2"/> Tourist Helpline: {emergency_contacts.tourist_helpline}</div>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};

export default TripDisplay;