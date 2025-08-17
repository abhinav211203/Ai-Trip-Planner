import React from 'react'
import ChatBot from './_components/ChatBot'

function CreateNewTrip () {
  return (
    // 👇 KEY CHANGE HERE: Removed the grid and column classes
    <div className='p-10'>
      {/* This div is no longer needed but is harmless */}
      <div>
        <ChatBot/>
      </div>
    </div>
  )
}

export default CreateNewTrip