"use client"
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SignInButton, SignOutButton, useUser } from '@clerk/nextjs'
export const menuoptions = [
  {
    name:'Home',
    path:'/'
  },
  {
    name:'My Trips',
    path:'/my-trips'
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
  const visibleMenuOptions = user
    ? menuoptions
    : menuoptions.filter((menu) => menu.path !== '/my-trips');

  return (
    <div className='flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between'>
      <div className='flex gap-2 items-center'>
        <Image src={'/logo.svg'} alt='logo' width={30} height={30} />
        <h2 className='font-bold text-2xl'>AI Trip Planner</h2>
      </div>
      <div className='flex flex-wrap gap-5 items-center'>
        {visibleMenuOptions.map((menu) => (
          <Link href={menu.path} key={menu.path}>
            <h2 className='text-lg hover:scale-105 transition-all hover:text-primary'>{menu.name}</h2>
          </Link>
        ))}
      </div>
      {user ? (
        <div className='flex flex-wrap gap-3 items-center'>
          <Link href={'/my-trips'}>
            <Button variant={'outline'}>My Trips</Button>
          </Link>
          <Link href={'/create-new-trip'}>
            <Button>Create New Trip</Button>
          </Link>
          <SignOutButton>
            <Button variant={'outline'} className='border-slate-300 text-slate-700'>
              Logout
            </Button>
          </SignOutButton>
        </div>
      ) : (
        <SignInButton>
          <Button>Get Started</Button>
        </SignInButton>
      )}
    </div>
    
  )
}

export default Header
