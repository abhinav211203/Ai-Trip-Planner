"use client"
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import React from 'react'
import {ArrowDown, Globe2, Landmark, Plane, Send} from 'lucide-react'
import HeroVideoDialog from "@/components/magicui/hero-video-dialog";
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation'

const suggestion = [
  {
    title:'Create New Trip',
    icon:<Globe2 className='text-blue-400 h-5 w-5'/>
  },
 {
    title:'Inspire me where to go',
    icon:<Plane className='text-green-600 h-5 w-5'/>
  },
 {
    title:'Discover Hidden Gems',
    icon:<Landmark className='text-orange-500 h-5 w-5'/>
  },
 {
    title:'Create New Trip',
    icon:<Globe2 className='text-yellow-400 h-5 w-5'/>
  },

]
const Hero = () => {
  const {user} = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [tripText, setTripText] = React.useState('');

  const handleTripSubmit = () => {
    if (!user) {
      // If not signed in, redirect to sign in
      router.push('/sign-in');
      return;
    }
    
    // If signed in, redirect to trip creation page or handle trip creation
    router.push('/create-new-trip');
    // You can also pass the trip text as a query parameter
    // router.push(`/create-trip?text=${encodeURIComponent(tripText)}`);
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
                  placeholder='Create Your Trip'
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
        <div className='flex gap-19'>
          {suggestion.map((suggestion,index)=>(
            <div key={index} className='flex items-center gap-2 border rounded-full p-2 hover:bg-primary hover:text-white'>
              {suggestion.icon}
              <h2 className='text-sm'>{suggestion.title}</h2>
              </div>
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