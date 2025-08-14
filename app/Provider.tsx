
"use client"
import React, { useContext, useEffect, useState } from 'react'
import Header from './_components/Header';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { UserDetailContext } from '@/context/userDetailContex';
function Provider(
    {
  children,
}: Readonly<{
  children: React.ReactNode;
}>
) {

  const CreateUser= useMutation(api.user.CreateNewUser)
  const [userDetail, setuserDetail]= useState<any>()
  const {user}= useUser()
  useEffect(()=>
  {
        user&& CreateNewUser();
  },[user])
  const CreateNewUser = async()=>
  {
    if(user)
    {
    const result= await CreateUser(
      {
        email:user?.primaryEmailAddress?.emailAddress??'',
        imageUrl:user?.imageUrl??'',
        name: user?.fullName??''
      }
    )
    setuserDetail(result)
  }
}
  return (
    <UserDetailContext.Provider value={{userDetail,setuserDetail}}>
    <div>
        <Header/>
            {children}
    </div>
    </UserDetailContext.Provider>
  )
}

export default Provider
export const useUserDetail=()=>{
  return useContext(UserDetailContext)
}