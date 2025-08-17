"use client"
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SignInButton, useUser, useClerk, SignOutButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
export const menuoptions = [
  {
    name:'Home',
    path:'/'
  },
  {
    name:'Pricing',
    path:'/pricing'
  },
  {
    name: 'Contact-us',
    path: '/contact'
  }
]
function Header() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  return (
    <div className='flex justify-between items-center p-4'>
      <div className='flex gap-2 items-center'>
        <Image src={'/logo.svg'} alt='logo' width={30} height={30} />
        <h2 className='font-bold text-2xl'>AI Trip Planner</h2>
      </div>
      <div className='flex gap-8 items-center'>
        {menuoptions.map((menu) => (
          <Link href={menu.path} key={menu.path}>
            <h2 className='text-lg hover:scale-105 transition-all hover:text-primary'>{menu.name}</h2>
          </Link>
        ))}
      </div>
      {user ? (
        <Link href={'/create-new-trip'}>
        <Button>Create New Trip</Button>
        </Link>
      ) : (
        <SignInButton>
          <Button>Get Started</Button>
        </SignInButton>
      )}
    </div>
    
  )
}

export default Header