"use client"
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import React from 'react'
import {ArrowDown, Globe2, Landmark, Plane, Send} from 'lucide-react'
import HeroVideoDialog from "@/components/magicui/hero-video-dialog";
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation'

export const suggestion = [
  {
    title:'Create New Trip',
    icon:<Globe2 className='text-blue-400 h-5 w-5'/>,
    mode: 'default',
  },
 {
    title:'Inspire me where to go',
    icon:<Plane className='text-green-600 h-5 w-5'/>,
    mode: 'inspire',
  },
 {
    title:'Discover Hidden Gems',
    icon:<Landmark className='text-orange-500 h-5 w-5'/>,
    mode: 'hidden-gems',
  },

]
const Hero = () => {
  const {user} = useUser();
  const router = useRouter();
  const [tripText, setTripText] = React.useState('');

  const navigateToPlanner = (prompt?: string) => {
    if (prompt?.trim()) {
      router.push(`/create-new-trip?mode=smart&prompt=${encodeURIComponent(prompt)}`);
      return;
    }

    router.push('/create-new-trip');
  };

  const handleTripSubmit = () => {
    if (!user) {
      router.push('/sign-in');
      return;
    }

    navigateToPlanner(tripText);
  }

  const handleSuggestionClick = (mode: string) => {
    if (!user) {
      router.push('/sign-in');
      return;
    }

    if (mode === 'default') {
      navigateToPlanner();
      return;
    }

    router.push(`/create-new-trip?mode=${encodeURIComponent(mode)}`);
  }

  return (
    <div className='mt-24 w-full flex justify-center items-center'>
        <div className='max-w-4xl text-center space-y-2'>
            <h1 className='text-xl md:text-5xl font-bold'> Hey I am Your Personal <span className='text-primary'>Trip Planner</span> </h1>
            <p className='text-lg p-3 font-bold'>Tell me What You Want, and I will handel the rest: Flights, trip Planner- all in seconds </p>
        <div>
            <div className='border rounded-2xl p-4 relative'>
                <Textarea 
                  className='w-full h-28 bg-transparent border-none resize-none focus-visible:ring-0' 
                  placeholder='Describe the trip you want, or use one of the quick actions below'
                  value={tripText}
                  onChange={(e) => setTripText(e.target.value)}
                />
                <Button 
                  size={'icon'} 
                  aria-label='Send trip request' 
                  className='absolute bottom-6 right-6' 
                  onClick={handleTripSubmit}
                >
                   <Send className='h-4 w-4'></Send>
                </Button>
            </div>
        </div>
        <div className='flex flex-wrap justify-center gap-4 pt-2'>
          {suggestion.map((suggestion,index)=>(
            <button
              key={index}
              type='button'
              onClick={() => handleSuggestionClick(suggestion.mode)}
              className='flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary hover:bg-primary hover:text-white'
            >
              {suggestion.icon}
              <span>{suggestion.title}</span>
            </button>
          ))}
        </div>
        <div className='flex justify-center items-center flex-col '>
          <h2 className=' flex p-5 '>Not Sure where to start? <strong className='ml-2'> See how it works</strong><ArrowDown/></h2>
          <HeroVideoDialog  className="block dark:hidden" animationStyle="from-center"videoSrc="https://www.example.com/dummy-video"
  thumbnailSrc="https://mma.prnewswire.com/media/2401528/1_MindtripProduct.jpg?p=facebook"
  thumbnailAlt="Dummy Video Thumbnail"
/></div>
 

        </div>
    </div>
  )
}

export default Hero
