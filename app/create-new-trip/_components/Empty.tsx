import { menuoptions } from '@/app/_components/Header'
import { suggestion } from '@/app/_components/Hero'
import { Link } from 'lucide-react'
import React from 'react'

export const Empty = ( {onSelectOption}:any) => {
  return (
    <div>
        <h2 className='font-bold text-3xl text-center mt-8'>Start Planning new <strong className='text-primary'>Trip</strong> using AI</h2>
          <div className='flex flex-col gap-5 mt-8'>
                {suggestion.map((suggestion,index)=>(
                  <div key={index} 
                  onClick={() => onSelectOption(suggestion.title)}

                  className='flex items-center gap-2 border rounded-3xl p-2 hover:bg-primary hover:text-white'>
                    {suggestion.icon}
                    <h2 className='text-shadow-accent-foreground'>{suggestion.title}</h2>
                    </div>
                ))}
              </div>
    </div>
  )
}
